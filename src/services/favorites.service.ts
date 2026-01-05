/**
 * Favorites Service
 * Like/Unlike tracks functionality
 */
import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../lib/appwrite';
import type { Favorite, Track } from '../types';

export const favoritesService = {
    /**
     * Check if a track is favorited by user
     * @param userId - User ID
     * @param trackId - Track ID to check
     * @returns Boolean indicating if track is favorited
     */
    async isFavorite(userId: string, trackId: string): Promise<boolean> {
        if (!userId || !trackId) return false;

        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.FAVORITES,
            [
                Query.equal('user_id', userId),
                Query.equal('track_id', trackId),
                Query.limit(1),
            ]
        );

        return response.total > 0;
    },

    /**
     * Add track to favorites
     * @param userId - User ID
     * @param track - Track object (includes source for hybrid architecture)
     */
    async addFavorite(userId: string, track: Track): Promise<void> {
        if (!userId || !track) {
            throw new Error('User ID and track are required');
        }

        // Check if already favorited (unique index will also prevent duplicates)
        const existing = await this.isFavorite(userId, track.$id);
        if (existing) return;

        await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.FAVORITES,
            ID.unique(),
            {
                user_id: userId,
                track_id: track.$id,
                track_source: track.source, // NEW: Store source for hybrid fetch
            },
            [
                `read("user:${userId}")`,
                `delete("user:${userId}")`,
            ]
        );
    },

    /**
     * Remove track from favorites
     * @param userId - User ID
     * @param trackId - Track to unfavorite
     */
    async removeFavorite(userId: string, trackId: string): Promise<void> {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.FAVORITES,
            [
                Query.equal('user_id', userId),
                Query.equal('track_id', trackId),
            ]
        );

        if (response.documents.length > 0) {
            await databases.deleteDocument(
                DATABASE_ID,
                COLLECTIONS.FAVORITES,
                response.documents[0].$id
            );
        }
    },

    /**
     * Toggle favorite status
     * @param userId - User ID
     * @param track - Track to toggle
     * @returns New favorite status
     */
    async toggleFavorite(userId: string, track: Track): Promise<boolean> {
        const isFav = await this.isFavorite(userId, track.$id);

        if (isFav) {
            await this.removeFavorite(userId, track.$id);
            return false;
        } else {
            await this.addFavorite(userId, track);
            return true;
        }
    },

    /**
     * Get all favorited tracks for a user
     * Handles hybrid architecture - fetches from Jamendo or Appwrite based on source
     * @param userId - User ID
     * @returns Array of favorited tracks
     */
    async getUserFavorites(userId: string): Promise<Track[]> {
        if (!userId) return [];

        const favorites = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.FAVORITES,
            [
                Query.equal('user_id', userId),
                Query.orderDesc('$createdAt'),
            ]
        );

        if (favorites.documents.length === 0) {
            return [];
        }

        // Fetch actual track data based on source
        const tracks = await Promise.all(
            favorites.documents.map(async (fav) => {
                const favorite = fav as unknown as Favorite;

                // Check source for hybrid fetch
                if (favorite.track_source === 'jamendo') {
                    // TODO: Fetch from Jamendo API by ID
                    console.warn(`Jamendo track ${favorite.track_id} in favorites - direct fetch not yet implemented`);
                    return null;
                } else {
                    // Appwrite track - fetch from database
                    try {
                        const track = await databases.getDocument(
                            DATABASE_ID,
                            COLLECTIONS.TRACKS,
                            favorite.track_id
                        );
                        return { ...track, source: 'appwrite' } as unknown as Track;
                    } catch {
                        // Track may have been deleted
                        return null;
                    }
                }
            })
        );

        // Filter out null values (deleted tracks or unimplemented Jamendo)
        return tracks.filter((t): t is Track => t !== null);
    },

    /**
     * Get favorite IDs for efficient checking (useful for lists)
     * @param userId - User ID
     * @returns Set of favorited track IDs
     */
    async getFavoriteIds(userId: string): Promise<Set<string>> {
        if (!userId) return new Set();

        const favorites = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.FAVORITES,
            [
                Query.equal('user_id', userId),
                Query.select(['track_id']), // Only fetch track_id for efficiency
            ]
        );

        return new Set(
            favorites.documents.map((f) => (f as unknown as Favorite).track_id)
        );
    },
};
