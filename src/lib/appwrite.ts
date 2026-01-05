/**
 * Appwrite Client Configuration
 * Central configuration for all Appwrite services
 */
import { Client, Account, Databases, Storage, Functions, ID, Query } from 'appwrite';

// Initialize Appwrite client
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

console.log('[Appwrite DEBUG] Endpoint:', endpoint);
console.log('[Appwrite DEBUG] Project ID:', projectId);

if (!endpoint || endpoint.includes('localhost')) {
    console.warn('[Appwrite WARNING] Endpoint is pointed to LOCALHOST or is empty. Requests WILL fail in production.');
}

const client = new Client()
    .setEndpoint(endpoint || 'http://localhost:5173')
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
console.log('[Appwrite DEBUG] Database ID:', DATABASE_ID);
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
            const proxyUrl = buildAudioProxyUrl(originalUrl);

            if (!proxyUrl) {
                console.warn('Audio proxy not configured, using original URL');
                return originalUrl;
            }

            console.log('[AudioProxy] Fetching via proxy:', originalUrl.substring(0, 50) + '...');

            // Fetch through the proxy with appropriate headers
            const response = await fetch(proxyUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'audio/mpeg, audio/*',
                },
            });

            if (!response.ok) {
                throw new Error(`Proxy fetch failed: ${response.status}`);
            }

            // Get the audio as a blob
            const blob = await response.blob();

            // Create a blob URL (same-origin, enables Web Audio API)
            const blobUrl = URL.createObjectURL(blob);

            // Cache it
            audioProxyCache.set(originalUrl, blobUrl);

            console.log('[AudioProxy] Created blob URL:', blobUrl.substring(0, 50) + '...');

            return blobUrl;
        } catch (error) {
            console.error('[AudioProxy] Fetch failed, falling back to original:', error);
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
 * Build the audio proxy URL
 * Uses the Appwrite function execution endpoint
 */
function buildAudioProxyUrl(originalUrl: string): string | null {
    const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
    const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
    const functionId = import.meta.env.VITE_FUNCTION_AUDIO_PROXY;

    if (!endpoint || !projectId || !functionId) {
        return null;
    }

    // Appwrite function execution URL with query parameter
    // Format: {endpoint}/functions/{functionId}/executions?url={encodedUrl}
    // Note: For public functions (execute: ["any"]), we can call via REST
    return `${endpoint}/functions/${functionId}/executions?url=${encodeURIComponent(originalUrl)}`;
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
