/**
 * Playlist Service
 * CRUD operations for user playlists
 */
import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../lib/appwrite';
import type { Playlist, PlaylistTrack, Track } from '../types';

export const playlistService = {
    /**
     * Get user's playlists
     * @param userId - The user ID to fetch playlists for
     * @returns Array of playlists belonging to the user
     */
    async getUserPlaylists(userId: string): Promise<Playlist[]> {
        if (!userId) return [];

        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.PLAYLISTS,
            [
                Query.equal('user_id', userId),
                Query.orderDesc('$createdAt'),
            ]
        );
        return response.documents as unknown as Playlist[];
    },

    /**
     * Get a single playlist by ID
     * @param playlistId - The playlist document ID
     * @returns The playlist document
     */
    async getPlaylist(playlistId: string): Promise<Playlist> {
        const response = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.PLAYLISTS,
            playlistId
        );
        return response as unknown as Playlist;
    },

    /**
     * Create a new playlist
     * @param userId - Owner's user ID
     * @param name - Playlist name
     * @param description - Optional description
     * @returns The created playlist
     */
    async createPlaylist(
        userId: string,
        name: string,
        description?: string
    ): Promise<Playlist> {
        if (!userId || !name.trim()) {
            throw new Error('User ID and playlist name are required');
        }

        const response = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.PLAYLISTS,
            ID.unique(),
            {
                user_id: userId,
                name: name.trim(),
                description: description?.trim() || null,
                is_public: false,
            },
            // Document-level permissions for owner
            [
                `read("user:${userId}")`,
                `update("user:${userId}")`,
                `delete("user:${userId}")`,
            ]
        );
        return response as unknown as Playlist;
    },

    /**
     * Update playlist details
     * @param playlistId - Playlist to update
     * @param updates - Fields to update
     * @returns Updated playlist
     */
    async updatePlaylist(
        playlistId: string,
        updates: Partial<Pick<Playlist, 'name' | 'description' | 'is_public'>>
    ): Promise<Playlist> {
        const response = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.PLAYLISTS,
            playlistId,
            updates
        );
        return response as unknown as Playlist;
    },

    /**
     * Delete a playlist and all its tracks
     * @param playlistId - Playlist to delete
     */
    async deletePlaylist(playlistId: string): Promise<void> {
        // First delete all playlist_tracks entries
        const tracks = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.PLAYLIST_TRACKS,
            [Query.equal('playlist_id', playlistId)]
        );

        // Delete each playlist_track entry
        await Promise.all(
            tracks.documents.map((doc) =>
                databases.deleteDocument(DATABASE_ID, COLLECTIONS.PLAYLIST_TRACKS, doc.$id)
            )
        );

        // Then delete the playlist
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.PLAYLISTS, playlistId);
    },

    /**
     * Add a track to a playlist
     * @param playlistId - Target playlist ID
     * @param track - Track object (includes source info for hybrid architecture)
     * @param userId - User ID for permissions
     */
    async addTrackToPlaylist(
        playlistId: string,
        track: Track,
        userId: string
    ): Promise<void> {
        // Check if track already in playlist (prevent duplicates)
        const existing = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.PLAYLIST_TRACKS,
            [
                Query.equal('playlist_id', playlistId),
                Query.equal('track_id', track.$id),
            ]
        );

        if (existing.total > 0) {
            return; // Track already exists in playlist
        }

        // Get current max position
        const tracks = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.PLAYLIST_TRACKS,
            [
                Query.equal('playlist_id', playlistId),
                Query.orderDesc('position'),
                Query.limit(1),
            ]
        );

        const nextPosition = tracks.documents.length > 0
            ? (tracks.documents[0] as unknown as PlaylistTrack).position + 1
            : 0;

        await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.PLAYLIST_TRACKS,
            ID.unique(),
            {
                playlist_id: playlistId,
                track_id: track.$id,
                track_source: track.source, // NEW: Store source for hybrid fetch
                position: nextPosition,
            },
            [
                `read("user:${userId}")`,
                `update("user:${userId}")`,
                `delete("user:${userId}")`,
            ]
        );
    },

    /**
     * Remove a track from a playlist
     * @param playlistId - Target playlist ID
     * @param trackId - Track to remove
     */
    async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
        const tracks = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.PLAYLIST_TRACKS,
            [
                Query.equal('playlist_id', playlistId),
                Query.equal('track_id', trackId),
            ]
        );

        if (tracks.documents.length > 0) {
            await databases.deleteDocument(
                DATABASE_ID,
                COLLECTIONS.PLAYLIST_TRACKS,
                tracks.documents[0].$id
            );
        }
    },

    /**
     * Get all tracks in a playlist (returns Track objects)
     * Handles hybrid architecture - fetches from Jamendo or Appwrite based on source
     * @param playlistId - Playlist to get tracks from
     * @returns Array of tracks in order
     */
    async getPlaylistTracks(playlistId: string): Promise<Track[]> {
        // Get playlist_tracks entries ordered by position
        const playlistTracks = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.PLAYLIST_TRACKS,
            [
                Query.equal('playlist_id', playlistId),
                Query.orderAsc('position'),
            ]
        );

        if (playlistTracks.documents.length === 0) {
            return [];
        }

        // Fetch actual track data based on source
        const tracks = await Promise.all(
            playlistTracks.documents.map(async (pt) => {
                const trackDoc = pt as unknown as PlaylistTrack;

                // Check source to determine where to fetch from
                if (trackDoc.track_source === 'jamendo') {
                    // TODO: Fetch from Jamendo API by ID
                    // For now, return a placeholder - requires jamendoService.getTrackById()
                    console.warn(`Jamendo track ${trackDoc.track_id} in playlist - direct fetch not yet implemented`);
                    return null;
                } else {
                    // Appwrite track - fetch from database
                    try {
                        const track = await databases.getDocument(
                            DATABASE_ID,
                            COLLECTIONS.TRACKS,
                            trackDoc.track_id
                        );
                        // Add source field for consistency
                        return { ...track, source: 'appwrite' } as unknown as Track;
                    } catch (error) {
                        console.error(`Failed to fetch track ${trackDoc.track_id}:`, error);
                        return null;
                    }
                }
            })
        );

        // Filter out nulls (failed fetches or unimplemented Jamendo)
        return tracks.filter((t): t is Track => t !== null);
    },
};
