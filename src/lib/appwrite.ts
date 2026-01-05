/**
 * Appwrite Client Configuration
 * Central configuration for all Appwrite services
 */
import { Client, Account, Databases, Storage, ID, Query } from 'appwrite';

// Initialize Appwrite client
const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

// Export service instances
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
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

// Audio proxy function ID
const AUDIO_PROXY_FUNCTION_ID = 'audio-proxy';

/**
 * Get the proxied audio URL for external audio sources (Jamendo)
 * 
 * This proxies audio through our Appwrite function to add CORS headers,
 * enabling Web Audio API visualization on cross-origin audio.
 * 
 * @param originalUrl - The original Jamendo audio URL
 * @returns Proxied URL with CORS headers
 */
export function getProxiedAudioUrl(originalUrl: string): string {
    const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
    const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

    // Encode the URL for safe transmission as a query parameter
    const encodedUrl = encodeURIComponent(originalUrl);

    // Appwrite function execution URL format
    return `${endpoint}/functions/${AUDIO_PROXY_FUNCTION_ID}/executions?url=${encodedUrl}&project=${projectId}`;
}

