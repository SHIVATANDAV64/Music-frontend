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
        const response = await manageFavorites<{ isFavorite: boolean }>({
            action: 'toggle',
            trackId: track.$id,
            trackSource: track.source,
        });

        if (!response.success) {
            throw new Error(response.error || 'Failed to toggle favorite');
        }

        return response.data?.isFavorite ?? false;
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
        // For Jamendo tracks, the function returns track_id to be fetched client-side
        // For Appwrite tracks, the function fetches the full track data
        const favorites = response.data || [];
        const tracks: Track[] = [];

        for (const fav of favorites) {
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
