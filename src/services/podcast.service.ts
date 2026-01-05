/**
 * Podcast Service
 * API layer for podcasts and episodes
 */
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite';
import type { Podcast, Episode } from '../types';

export const podcastService = {
    /**
     * Get all podcasts
     */
    async getPodcasts(options?: {
        category?: string;
        limit?: number;
        offset?: number;
    }): Promise<Podcast[]> {
        const queries = [];

        if (options?.category) {
            queries.push(Query.equal('category', options.category));
        }
        if (options?.limit) {
            queries.push(Query.limit(options.limit));
        }
        if (options?.offset) {
            queries.push(Query.offset(options.offset));
        }

        queries.push(Query.orderDesc('$createdAt'));

        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.PODCASTS,
            queries
        );

        return response.documents as unknown as Podcast[];
    },

    /**
     * Get single podcast by ID
     */
    async getPodcast(id: string): Promise<Podcast> {
        const response = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.PODCASTS,
            id
        );
        return response as unknown as Podcast;
    },

    /**
     * Get episodes for a podcast
     */
    async getEpisodes(podcastId: string): Promise<Episode[]> {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.EPISODES,
            [
                Query.equal('podcast_id', podcastId),
                Query.orderDesc('episode_number')
            ]
        );
        return response.documents as unknown as Episode[];
    },

    /**
     * Get single episode by ID
     */
    async getEpisode(id: string): Promise<Episode> {
        const response = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.EPISODES,
            id
        );
        return response as unknown as Episode;
    },
};
