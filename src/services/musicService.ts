/**
 * Music Service - Frontend API calls
 * Uses Jamendo API for real music (with secure env vars)
 * Part of hybrid architecture: Jamendo + Appwrite
 */

import { getTracks, searchTracks, getTracksByGenre, getTrendingTracks, getFeaturedByGenre, JAMENDO_GENRES, type JamendoTrack } from './jamendoService';
import type { Track } from '../types';

/**
 * Convert Jamendo track to our unified Track type
 */
function convertJamendoTrack(jamendoTrack: JamendoTrack): Track {
    return {
        $id: jamendoTrack.id,
        $createdAt: jamendoTrack.releasedate,
        $updatedAt: jamendoTrack.releasedate,
        $permissions: [],
        $databaseId: 'jamendo',
        $collectionId: 'tracks',
        title: jamendoTrack.name,
        artist: jamendoTrack.artist_name,
        album: jamendoTrack.album_name || jamendoTrack.name,
        duration: jamendoTrack.duration,
        play_count: 0,

        // SOURCE DISCRIMINATION - This is a Jamendo track
        source: 'jamendo',
        jamendo_id: jamendoTrack.id,

        // Jamendo provides direct URLs (not Appwrite storage IDs)
        audio_url: jamendoTrack.audio,
        cover_url: jamendoTrack.album_image,
    };
}

export const musicService = {
    /**
     * Get tracks with optional filters
     */
    async getTracks(options: {
        limit?: number;
        offset?: number;
        genre?: string;
        search?: string;
    } = {}): Promise<Track[]> {
        const { limit = 20, offset = 0, genre, search } = options;

        try {
            let response;

            if (search) {
                response = await searchTracks(search, limit);
            } else if (genre && genre !== 'All') {
                response = await getTracksByGenre(genre, limit);
            } else {
                response = await getTracks({ limit, offset });
            }

            if (response.headers.status !== 'success') {
                throw new Error(response.headers.error_message || 'Failed to fetch tracks');
            }

            return response.results.map(convertJamendoTrack);
        } catch (error) {
            console.error('Music service error:', error);
            throw error;
        }
    },

    /**
     * Get tracks by genre
     */
    async getTracksByGenre(genre: string, limit = 20): Promise<Track[]> {
        return this.getTracks({ genre, limit });
    },

    /**
     * Search tracks
     */
    async searchTracks(query: string, limit = 20): Promise<Track[]> {
        return this.getTracks({ search: query, limit });
    },

    /**
     * Get trending/featured tracks - Spotify-like chart experience
     * Uses Jamendo's curated selections with popularity boost
     */
    async getTrendingTracks(limit = 20): Promise<Track[]> {
        try {
            const response = await getTrendingTracks(limit);
            if (response.headers.status !== 'success') {
                throw new Error(response.headers.error_message || 'Failed to fetch trending tracks');
            }
            return response.results.map(convertJamendoTrack);
        } catch (error) {
            console.error('Failed to get trending tracks:', error);
            throw error;
        }
    },

    /**
     * Get featured tracks by genre - for discovery sections
     */
    async getFeaturedByGenre(genre: string, limit = 10): Promise<Track[]> {
        try {
            const response = await getFeaturedByGenre(genre, limit);
            if (response.headers.status !== 'success') {
                throw new Error(response.headers.error_message || 'Failed to fetch featured tracks');
            }
            return response.results.map(convertJamendoTrack);
        } catch (error) {
            console.error(`Failed to get featured ${genre} tracks:`, error);
            throw error;
        }
    },

    /**
     * Get available genres
     */
    getGenres(): string[] {
        return [...JAMENDO_GENRES];
    },
};

