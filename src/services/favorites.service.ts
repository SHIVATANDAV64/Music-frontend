/**
 * Favorites Service
 * Like/Unlike tracks via Appwrite Functions
 */
import { manageFavorites } from '../lib/functions';
import type { Track } from '../types';

export const favoritesService = {
    /**
     * Check if a track is favorited by user
     */
    async isFavorite(userId: string, trackId: string): Promise<boolean> {
        if (!userId || !trackId) return false;

        const response = await manageFavorites<any>({
            action: 'check',
            trackId,
        });

        return response.success && response.data?.success && response.data?.data?.isFavorite === true;
    },

    /**
     * Add track to favorites
     */
    async addFavorite(userId: string, track: Track): Promise<void> {
        if (!userId || !track) {
            throw new Error('User ID and track are required');
        }

        const response = await manageFavorites<any>({
            action: 'add',
            trackId: track.$id,
            trackSource: track.source,
            metadata: track, // Send full metadata for ingestion
        });

        if (!response.success || !response.data?.success) {
            throw new Error(response.error || response.data?.error || 'Failed to add favorite');
        }
    },

    /**
     * Remove track from favorites
     */
    async removeFavorite(_userId: string, trackId: string): Promise<void> {
        const response = await manageFavorites<any>({
            action: 'remove',
            trackId,
        });

        if (!response.success || !response.data?.success) {
            throw new Error(response.error || response.data?.error || 'Failed to remove favorite');
        }
    },

    /**
     * Toggle favorite status
     * @returns New favorite status (true = favorited, false = unfavorited)
     */
    async toggleFavorite(track: Track): Promise<boolean> {
        try {
            const response = await manageFavorites<any>({
                action: 'toggle',
                trackId: track.$id,
                trackSource: track.source,
                metadata: track // Send full metadata for ingestion
            });

            if (!response.success || !response.data?.success) {
                if (response.error?.includes('Unknown attribute: "track_source"') || response.data?.error?.includes('Unknown attribute: "track_source"')) {
                    throw new Error('Database Schema Mismatch: The "favorites" collection is missing the "track_source" attribute. Please add it in Appwrite Console.');
                }
                throw new Error(response.error || response.data?.error || 'Failed to toggle favorite');
            }

            return response.data?.data?.isFavorite ?? false;
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

        const response = await manageFavorites<any>({
            action: 'list',
        });

        if (!response.success || !response.data?.success) {
            console.error('Failed to get favorites:', response.error || response.data?.error);
            return [];
        }

        const favoritesData = response.data.data || [];
        const tracks: Track[] = [];

        for (const fav of favoritesData) {
            if (fav?.track) {
                tracks.push(fav.track);
            }
        }

        return tracks;
    },

    /**
     * Get favorite IDs for efficient checking (useful for lists)
     */
    async getFavoriteIds(userId: string): Promise<Set<string>> {
        if (!userId) return new Set();

        const response = await manageFavorites<any>({
            action: 'get_ids',
        });

        if (!response.success || !response.data?.success) {
            return new Set();
        }

        return new Set(response.data.data?.ids || []);
    },
};
