/**
 * Appwrite Client Configuration
 * Central configuration for all Appwrite services
 */
import { Client, Account, Databases, Storage, Functions, ID, Query } from 'appwrite';

// Initialize Appwrite client
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

// Endpoint Validation
if (!endpoint) {
    console.error('[Appwrite ERROR] VITE_APPWRITE_ENDPOINT is missing!');
} else {
    // Check if it looks like a static site instead of API
    if (endpoint.includes('appwrite.network') && !endpoint.includes('/v1')) {
        console.error('[Appwrite ERROR] The endpoint looks like a static site URL (appwrite.network) but is missing "/v1". You might have pointed your API to your own website URL!');
    }

    if (endpoint.includes('localhost') && !endpoint.includes(':')) {
        console.warn('[Appwrite WARNING] Localhost endpoint might be missing a port.');
    }

    if (!endpoint.startsWith('http')) {
        console.error('[Appwrite ERROR] Endpoint must start with http:// or https://');
    }
}

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId);

// Export client and service instances
export { client };
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);
export { ID, Query };

// Database ID constant
export const DATABASE_ID = import.meta.env.VITE_DATABASE_ID;

if (!DATABASE_ID) {
    console.warn('[Appwrite WARNING] VITE_DATABASE_ID is missing! Database features will fail.');
}

// Collection IDs - matches Appwrite database schema
export const COLLECTIONS = {
    USERS: 'users',
    TRACKS: 'tracks',
    PODCASTS: 'podcasts',
    EPISODES: 'episodes',
    PLAYLISTS: 'playlists',
    PLAYLIST_TRACKS: 'playlist_tracks',
    RECENTLY_PLAYED: 'recently_played',
    FAVORITES: 'favorites',
} as const;

// Storage bucket IDs
export const BUCKETS = {
    AUDIO: 'audio_files',
    COVERS: 'cover_images',
} as const;

// Type exports for collection names
export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
export type BucketName = typeof BUCKETS[keyof typeof BUCKETS];

/**
 * Audio Proxy Configuration
 * 
 * For Web Audio API visualization to work with cross-origin audio (like Jamendo),
 * we need to fetch the audio through a CORS proxy and create a Blob URL.
 * Blob URLs are same-origin, so Web Audio API can analyze them.
 */

// Cache for proxied audio blob URLs (original URL -> blob URL)
const audioProxyCache = new Map<string, string>();

// Pending proxy requests to avoid duplicate fetches
const pendingProxyRequests = new Map<string, Promise<string>>();

/**
 * Fetch audio through CORS proxy and return a Blob URL
 * This enables Web Audio API visualization for cross-origin audio
 * 
 * @param originalUrl - The original audio URL (e.g., Jamendo)
 * @returns Promise<string> - A blob URL that can be used with Web Audio API
 */
export async function fetchProxiedAudioBlob(originalUrl: string): Promise<string> {
    // Return cached blob URL if available
    if (audioProxyCache.has(originalUrl)) {
        return audioProxyCache.get(originalUrl)!;
    }

    // Return pending request if already in progress
    if (pendingProxyRequests.has(originalUrl)) {
        return pendingProxyRequests.get(originalUrl)!;
    }

    // Start the fetch
    const fetchPromise = (async () => {
        try {
            const functionId = import.meta.env.VITE_FUNCTION_AUDIO_PROXY;
            if (!functionId) {
                console.warn('[AudioProxy] Function ID missing, falling back to original');
                return originalUrl;
            }



            const execution = await functions.createExecution(
                functionId,
                '', // No body needed
                false, // synchronous execution
                `/?url=${encodeURIComponent(originalUrl)}`
            );

            if (execution.status !== 'completed' || !execution.responseBody) {
                throw new Error(`Proxy failed: ${execution.status}`);
            }

            // Parse the response to get the fileId
            const result = JSON.parse(execution.responseBody);
            if (!result.success || !result.fileId) {
                throw new Error(result.error || 'Proxy failed to return file ID');
            }

            // Generate a Storage View URL
            const storageUrl = storage.getFileView(BUCKETS.AUDIO, result.fileId).toString();



            // Convert to real Blob URL for perfect seeking & visualization
            const response = await fetch(storageUrl);
            if (!response.ok) throw new Error(`Failed to fetch file data: ${response.statusText}`);

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            audioProxyCache.set(originalUrl, blobUrl);


            return blobUrl;


        } catch (error: any) {
            console.error('[AudioProxy] Proxy failed:', error);

            if (error.code === 401 || error.code === 403) {
                console.error('[AudioProxy] PERMISSION ERROR: Please ensure the "Audio Proxy" function has "Execute Access" set to "any" or "users" in Appwrite Console.');
            }

            console.warn('[AudioProxy] Falling back to original URL. Visualization will be disabled due to CORS.');
            return originalUrl;
        } finally {
            // Clean up pending request
            pendingProxyRequests.delete(originalUrl);
        }
    })();

    pendingProxyRequests.set(originalUrl, fetchPromise);
    return fetchPromise;
}

/**
 * Fetch a file directly from Appwrite Storage as a Blob URL
 * Useful for visualization of admin-uploaded files
 */
export async function fetchStorageAudioBlob(fileId: string): Promise<string> {
    const cacheKey = `storage:${fileId}`;

    // Return cached blob URL if available
    if (audioProxyCache.has(cacheKey)) {
        return audioProxyCache.get(cacheKey)!;
    }

    // Return pending request if already in progress
    if (pendingProxyRequests.has(cacheKey)) {
        return pendingProxyRequests.get(cacheKey)!;
    }

    const fetchPromise = (async () => {
        try {
            // Generate a Storage View URL
            const storageUrl = storage.getFileView(BUCKETS.AUDIO, fileId).toString();



            // Convert to real Blob URL for perfect seeking & visualization
            const response = await fetch(storageUrl);
            if (!response.ok) throw new Error(`Failed to fetch file data: ${response.statusText}`);

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            audioProxyCache.set(cacheKey, blobUrl);

            return blobUrl;
        } catch (error) {
            console.error('[StorageProxy] Failed:', error);
            // Fallback to direct view URL if blob fetch fails
            return storage.getFileView(BUCKETS.AUDIO, fileId).toString();
        } finally {
            pendingProxyRequests.delete(cacheKey);
        }
    })();

    pendingProxyRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
}



/**
 * Sync version - returns original URL immediately
 * Used for initial audio element src before proxy fetch completes
 */
export function getProxiedAudioUrlSync(originalUrl: string): string {
    // Return cached blob URL if available
    if (audioProxyCache.has(originalUrl)) {
        return audioProxyCache.get(originalUrl)!;
    }
    // Otherwise return original for immediate playback
    return originalUrl;
}

/**
 * Check if a URL has been proxied and cached
 */
export function isAudioProxied(originalUrl: string): boolean {
    return audioProxyCache.has(originalUrl);
}

/**
 * Cleanup blob URLs when no longer needed
 */
export function revokeProxiedAudioUrl(originalUrl: string): void {
    const blobUrl = audioProxyCache.get(originalUrl);
    if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
        audioProxyCache.delete(originalUrl);
    }
}

/**
 * Preload audio through proxy for smoother playback
 * Call this when hovering over a track or loading a playlist
 */
export function preloadAudioProxy(originalUrl: string): void {
    // Fire and forget - preload in background
    fetchProxiedAudioBlob(originalUrl).catch(() => {
        // Ignore errors during preload
    });
}
