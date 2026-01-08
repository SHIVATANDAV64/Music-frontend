/**
 * Music Service - Frontend API calls
 * Uses Jamendo API for real music (with secure env vars)
 * Part of hybrid architecture: Jamendo + Appwrite
 */

import { getTracks, searchTracks, getTracksByGenre, getTrendingTracks, getFeaturedByGenre, getTrackById, JAMENDO_GENRES, type JamendoTrack } from './jamendoService';
import { databases, COLLECTIONS, Query, storage, BUCKETS, functions } from '../lib/appwrite';
import { searchContent } from '../lib/functions';
import type { Track, TrackSource } from '../types';

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
            // Parallel fetch from both sources for hybrid architecture
            const [jamendoResponse, appwriteResponse] = await Promise.allSettled([
                search ? searchTracks(search, limit) :
                    (genre && genre !== 'All') ? getTracksByGenre(genre, limit) :
                        getTracks({ limit, offset }),

                // Fetch from Appwrite (Internal) - Now using specific search function if query exists
                search ? searchContent({ query: search, limit }) : this.getUploadedTracks()
            ]);

            let tracks: Track[] = [];
            const trackMap = new Map<string, Track>();

            // 1. Process Appwrite tracks (User uploads + Ingested Jamendo tracks)
            if (appwriteResponse.status === 'fulfilled') {
                let uploaded: Track[] = [];
                const res = appwriteResponse.value;

                // Handle both direct DB results and Function results
                const functionResponse = (res as any)?.data;

                if (Array.isArray(res)) {
                    // Direct DB result
                    uploaded = res.map(t => ({ ...t, source: 'appwrite' as TrackSource }));
                } else if (functionResponse?.success && functionResponse?.results && Array.isArray(functionResponse.results.tracks)) {
                    // Search function result format
                    uploaded = functionResponse.results.tracks.map((t: any) => ({ ...t, source: 'appwrite' as TrackSource }));
                } else if (functionResponse?.success && Array.isArray(functionResponse?.data)) {
                    // Get-tracks function result format
                    uploaded = functionResponse.data.map((t: any) => ({ ...t, source: 'appwrite' as TrackSource }));
                }

                if (search && !((appwriteResponse.value as any)?.success)) {
                    // Fallback filtering if we didn't use the search function or it failed
                    const searchLower = search.toLowerCase();
                    uploaded = uploaded.filter(t =>
                        (t.title?.toLowerCase().includes(searchLower)) ||
                        (t.artist?.toLowerCase().includes(searchLower))
                    );
                }

                if (genre && genre !== 'All') {
                    uploaded = uploaded.filter(t => t.genre === genre);
                }

                // Add to map - Appwrite source takes priority
                uploaded.forEach(track => {
                    trackMap.set(track.$id, track);
                });
            }

            // 2. Process Jamendo tracks (External API)
            if (jamendoResponse.status === 'fulfilled' && jamendoResponse.value?.headers?.status === 'success') {
                const jamendoTracks = jamendoResponse.value.results.map(convertJamendoTrack);

                jamendoTracks.forEach(track => {
                    // Only add if not already in map (prevents duplicates when a Jamendo track is already ingested)
                    if (!trackMap.has(track.$id)) {
                        trackMap.set(track.$id, track);
                    }
                });
            }

            // Convert map back to array
            tracks = Array.from(trackMap.values());

            // Final slice and return
            return tracks.slice(0, limit);
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
     * Get a single track by ID (hybrid)
     */
    async getTrack(itemId: string): Promise<Track | null> {
        try {
            // 1. Try Appwrite DB first (inflated metadata should be here if ingested)
            try {
                const track = await databases.getDocument(
                    import.meta.env.VITE_DATABASE_ID,
                    COLLECTIONS.TRACKS,
                    itemId
                );
                // Determine source based on fields
                const source = (track as any).audio_url ? 'jamendo' : 'appwrite';
                return { ...track, source } as unknown as Track;
            } catch (e: any) {
                if (e.code !== 404) throw e;
            }

            // 2. Fallback to Jamendo API if not in our DB
            const jamendoTrack = await getTrackById(itemId);
            if (jamendoTrack) {
                return convertJamendoTrack(jamendoTrack);
            }

            return null;
        } catch (error) {
            console.error('Failed to get track:', error);
            return null;
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

    /**
     * Get uploaded tracks (Appwrite source)
     * For Admin Dashboard
     */
    async getUploadedTracks(): Promise<Track[]> {
        try {
            // Priority: Use the Appwrite Function for the core execution
            const functionId = import.meta.env.VITE_FUNCTION_GET_TRACKS;
            if (functionId) {
                const execution = await functions.createExecution(
                    functionId,
                    JSON.stringify({ limit: 50 }),
                    false
                );

                if (execution.status === 'completed' && execution.responseBody) {
                    const result = JSON.parse(execution.responseBody);
                    if (result.success && Array.isArray(result.data)) {
                        // FILTER: Only show true uploads (no jamendo_id)
                        return (result.data as Track[]).filter(t => !t.jamendo_id);
                    }
                }
            }
        } catch (e) {
            // Function call failed silently - fallback to direct DB below
        }

        // Direct DB Fallback if function fails or is missing
        const response = await databases.listDocuments(
            import.meta.env.VITE_DATABASE_ID,
            COLLECTIONS.TRACKS,
            [
                Query.isNotNull('audio_file_id'),
                Query.isNull('jamendo_id'), // Only manual uploads
                Query.orderDesc('$createdAt')
            ]
        );
        return response.documents as unknown as Track[];
    },

    /**
     * Delete an uploaded track and its files
     */
    async deleteTrack(track: Track): Promise<void> {
        if (track.source !== 'appwrite') throw new Error('Cannot delete external tracks');

        // 1. Delete Audio File
        if (track.audio_file_id) {
            try {
                await storage.deleteFile(BUCKETS.AUDIO, track.audio_file_id);
            } catch (e) {
                // Audio file deletion failed - continue with document deletion
            }
        }

        // 2. Delete Cover Image
        if (track.cover_image_id) {
            try {
                await storage.deleteFile(BUCKETS.COVERS, track.cover_image_id);
            } catch (e) {
                // Cover image deletion failed - continue with document deletion
            }
        }

        // 3. Delete Document
        await databases.deleteDocument(
            import.meta.env.VITE_DATABASE_ID,
            COLLECTIONS.TRACKS,
            track.$id
        );
    }
};

