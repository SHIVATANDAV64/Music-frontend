/**
 * Playlist Service
 * CRUD operations for user playlists via Appwrite Functions
 */
import { managePlaylists } from '../lib/functions';
import type { Playlist, Track } from '../types';

export const playlistService = {
    /**
     * Get user's playlists
     */
    async getUserPlaylists(userId: string): Promise<Playlist[]> {
        if (!userId) return [];

        const response = await managePlaylists<any>({
            action: 'list',
        });

        if (!response.success || !response.data?.success) {
            console.error('Failed to get playlists:', response.error || response.data?.error);
            return [];
        }

        return (response.data.data || []) as Playlist[];
    },

    /**
     * Get a single playlist by ID with tracks
     */
    async getPlaylist(playlistId: string): Promise<Playlist | null> {
        const response = await managePlaylists<any>({
            action: 'read',
            playlistId,
        });

        if (!response.success || !response.data?.success) {
            console.error('Failed to get playlist:', response.error || response.data?.error);
            return null;
        }

        return response.data.data as Playlist;
    },

    /**
     * Create a new playlist
     */
    async createPlaylist(
        userId: string,
        name: string,
        description?: string
    ): Promise<Playlist | null> {
        if (!userId || !name.trim()) {
            throw new Error('User ID and playlist name are required');
        }

        const response = await managePlaylists<any>({
            action: 'create',
            name: name.trim(),
            description: description?.trim(),
        });

        if (!response.success || !response.data?.success) {
            throw new Error(response.error || response.data?.error || 'Failed to create playlist');
        }

        return response.data.data as Playlist;
    },

    /**
     * Update playlist details
     */
    async updatePlaylist(
        playlistId: string,
        updates: Partial<Pick<Playlist, 'name' | 'description' | 'is_public'>>
    ): Promise<Playlist | null> {
        const response = await managePlaylists<any>({
            action: 'update',
            playlistId,
            ...updates,
        });

        if (!response.success || !response.data?.success) {
            throw new Error(response.error || response.data?.error || 'Failed to update playlist');
        }

        return response.data.data as Playlist;
    },

    /**
     * Delete a playlist and all its tracks
     */
    async deletePlaylist(playlistId: string): Promise<void> {
        const response = await managePlaylists<any>({
            action: 'delete',
            playlistId,
        });

        if (!response.success || !response.data?.success) {
            throw new Error(response.error || response.data?.error || 'Failed to delete playlist');
        }
    },

    /**
     * Add a track to a playlist
     */
    async addTrackToPlaylist(
        playlistId: string,
        track: Track,
        _userId: string // kept for API compatibility
    ): Promise<void> {
        const response = await managePlaylists<any>({
            action: 'add_track',
            playlistId,
            trackId: track.$id,
            trackSource: track.source,
            metadata: track, // Send full metadata for ingestion
        });

        if (!response.success || !response.data?.success) {
            throw new Error(response.error || response.data?.error || 'Failed to add track to playlist');
        }
    },

    /**
     * Remove a track from a playlist
     */
    async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
        const response = await managePlaylists<any>({
            action: 'remove_track',
            playlistId,
            trackId,
        });

        if (!response.success || !response.data?.success) {
            throw new Error(response.error || response.data?.error || 'Failed to remove track from playlist');
        }
    },

    /**
     * Get all tracks in a playlist
     * Returns Track objects with full data
     */
    async getPlaylistTracks(playlistId: string): Promise<Track[]> {
        const response = await managePlaylists<any>({
            action: 'read',
            playlistId,
        });

        if (!response.success || !response.data?.success || !response.data?.data) {
            console.error('Failed to get playlist tracks:', response.error || response.data?.error);
            return [];
        }

        // The function returns tracks in the nested data attribute
        return (response.data.data.tracks || []) as Track[];
    },
};
