/**
 * Appwrite Client Configuration
 * Central configuration for all Appwrite services
 */
import { Client, Account, Databases, Storage, Functions, ID, Query, ExecutionMethod } from 'appwrite';

// Initialize Appwrite client
const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

// Export client and service instances
export { client };
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);
export { ID, Query };

// Database ID constant
export const DATABASE_ID = import.meta.env.VITE_DATABASE_ID || 'music_db';

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

// Audio Proxy Function ID
const AUDIO_PROXY_FUNCTION_ID = import.meta.env.VITE_FUNCTION_AUDIO_PROXY;

/**
 * Cache for proxied audio blob URLs
 * Maps original URL -> blob URL
 */
const audioProxyCache = new Map<string, string>();

/**
 * Get proxied audio for external sources (Jamendo)
 * Uses Appwrite function to add CORS headers for Web Audio API visualization
 * 
 * This fetches audio through the proxy function and creates a blob URL
 * that can be used with both <audio> element and Web Audio API
 * 
 * @param originalUrl - The original Jamendo audio URL
 * @returns Promise<string> - Blob URL with CORS-safe audio
 */
export async function getProxiedAudioUrl(originalUrl: string): Promise<string> {
    // Check cache first
    if (audioProxyCache.has(originalUrl)) {
        return audioProxyCache.get(originalUrl)!;
    }

    // If no proxy function configured, return original URL
    if (!AUDIO_PROXY_FUNCTION_ID) {
        console.warn('VITE_FUNCTION_AUDIO_PROXY not set, using original URL');
        return originalUrl;
    }

    try {
        // Call the audio-proxy function via Appwrite SDK
        // The function has execute: ["any"] so it works without auth
        const execution = await functions.createExecution(
            AUDIO_PROXY_FUNCTION_ID,
            '', // no body needed, URL is in query/path
            false, // sync execution
            `/?url=${encodeURIComponent(originalUrl)}`, // path with URL param
            ExecutionMethod.GET
        );

        if (execution.status !== 'completed') {
            console.error('Audio proxy execution failed:', execution.errors);
            return originalUrl;
        }

        // The response body is the audio data as base64 or Uint8Array
        // For large audio files, we should use streaming, but for now:
        const responseData = execution.responseBody;

        // If the response is base64 audio data, convert to blob
        if (responseData && responseData.length > 0) {
            // Try to parse as JSON first (error response)
            try {
                const jsonResponse = JSON.parse(responseData);
                if (!jsonResponse.success) {
                    console.error('Audio proxy error:', jsonResponse.error);
                    return originalUrl;
                }
            } catch {
                // Not JSON, assume it's audio data
                // Convert to blob URL
                const blob = new Blob([Uint8Array.from(atob(responseData), c => c.charCodeAt(0))], {
                    type: 'audio/mpeg'
                });
                const blobUrl = URL.createObjectURL(blob);
                audioProxyCache.set(originalUrl, blobUrl);
                return blobUrl;
            }
        }

        return originalUrl;
    } catch (error) {
        console.error('Audio proxy call failed:', error);
        return originalUrl;
    }
}

/**
 * Sync version that returns original URL immediately
 * Use getProxiedAudioUrl for proper CORS proxying
 */
export function getProxiedAudioUrlSync(originalUrl: string): string {
    // For sync access (like audio element src), use original URL
    // Web Audio API visualization may not work for Jamendo tracks
    return originalUrl;
}

/**
 * Cleanup blob URLs when no longer needed
 */
export function revokeProxiedAudioUrl(originalUrl: string): void {
    const blobUrl = audioProxyCache.get(originalUrl);
    if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        audioProxyCache.delete(originalUrl);
    }
}
