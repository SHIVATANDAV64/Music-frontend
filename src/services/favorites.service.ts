/**
 * Favorites Service
 * Like/Unlike tracks via Appwrite Functions
 */
import { manageFavorites } from '../lib/functions';
import type { Track } from '../types';

interface FavoriteResponse {
    $id: string;
    user_id: string;
    track_id: string;
    track_source: 'jamendo' | 'appwrite';
    $createdAt: string;
    track?: Track;
}

export const favoritesService = {
    /**
     * Check if a track is favorited by user
     */
    async isFavorite(userId: string, trackId: string): Promise<boolean> {
        if (!userId || !trackId) return false;

        const response = await manageFavorites<{ isFavorite: boolean }>({
            action: 'check',
            trackId,
        });

        return response.success && response.data?.isFavorite === true;
    },

    /**
     * Add track to favorites
     */
    async addFavorite(userId: string, track: Track): Promise<void> {
        if (!userId || !track) {
            throw new Error('User ID and track are required');
        }

        const response = await manageFavorites({
            action: 'add',
            trackId: track.$id,
            trackSource: track.source,
        });

        if (!response.success) {
            throw new Error(response.error || 'Failed to add favorite');
        }
    },

    /**
     * Remove track from favorites
     */
    async removeFavorite(_userId: string, trackId: string): Promise<void> {
        const response = await manageFavorites({
            action: 'remove',
            trackId,
        });

        if (!response.success) {
            throw new Error(response.error || 'Failed to remove favorite');
        }
    },

    /**
     * Toggle favorite status
     * @returns New favorite status (true = favorited, false = unfavorited)
     */
    async toggleFavorite(_userId: string, track: Track): Promise<boolean> {
        try {
            const response = await manageFavorites<{ isFavorite: boolean }>({
                action: 'toggle',
                trackId: track.$id,
                trackSource: track.source,
            });

            if (!response.success) {
                if (response.error?.includes('Unknown attribute: "track_source"')) {
                    throw new Error('Database Schema Mismatch: The "favorites" collection is missing the "track_source" attribute. Please add it in Appwrite Console.');
                }
                throw new Error(response.error || 'Failed to toggle favorite');
            }

            const data = response.data as any;
            return data?.isFavorite ?? data?.data?.isFavorite ?? false;
        } catch (err: any) {
            console.error('[FavoritesService] Toggle failed:', err);
            // Re-throw with a more user-friendly message if it's the schema error
            if (err.message.includes('track_source')) {
                throw err;
            }
            throw new Error('Failed to toggle favorite. Please check your internet connection or Appwrite Console.');
        }
    },

    /**
     * Get all favorited tracks for a user
     * Handles hybrid architecture - returns tracks with full data
     */
    async getUserFavorites(userId: string): Promise<Track[]> {
        if (!userId) return [];

        const response = await manageFavorites<FavoriteResponse[]>({
            action: 'list',
        });

        if (!response.success) {
            console.error('Failed to get favorites:', response.error);
            return [];
        }

        // Map favorites to tracks
        // Handle double-wrapping from function response
        const rawData = response.data as any;
        let favoritesData: FavoriteResponse[] = [];

        if (Array.isArray(rawData)) {
            favoritesData = rawData;
        } else if (rawData && typeof rawData === 'object') {
            if (Array.isArray(rawData.data)) {
                favoritesData = rawData.data;
            } else if (Array.isArray(rawData.documents)) {
                favoritesData = rawData.documents;
            }
        }

        const tracks: Track[] = [];

        for (const fav of favoritesData) {
            if (!fav) continue; // Safety check
            if (fav.track) {
                // Appwrite track with full data
                tracks.push(fav.track);
            } else if (fav.track_source === 'jamendo') {
                // Jamendo tracks need to be fetched separately
                // Return a placeholder that can be identified and fetched
                tracks.push({
                    $id: fav.track_id,
                    $createdAt: fav.$createdAt,
                    $updatedAt: fav.$createdAt,
                    $permissions: [],
                    $databaseId: 'jamendo',
                    $collectionId: 'tracks',
                    title: 'Loading...',
                    artist: '',
                    album: '',
                    duration: 0,
                    play_count: 0,
                    source: 'jamendo',
                    jamendo_id: fav.track_id,
                } as unknown as Track);
            }
        }

        return tracks;
    },

    /**
     * Get favorite IDs for efficient checking (useful for lists)
     */
    async getFavoriteIds(userId: string): Promise<Set<string>> {
        if (!userId) return new Set();

        const response = await manageFavorites<{ ids: string[] }>({
            action: 'get_ids',
        });

        if (!response.success) {
            return new Set();
        }

        return new Set(response.data?.ids || []);
    },
};
