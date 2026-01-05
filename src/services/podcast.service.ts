/**
 * Podcast Service
 * API layer for podcasts and episodes via Appwrite Functions
 */
import { getPodcasts } from '../lib/functions';
import type { Podcast, Episode } from '../types';

interface PodcastResponse {
    $id: string;
    title: string;
    author: string;
    description?: string;
    category?: string;
    cover_image_id?: string;
    $createdAt: string;
    $updatedAt: string;
    episodes?: Episode[];
}

export const podcastService = {
    /**
     * Get all podcasts
     */
    async getPodcasts(options?: {
        category?: string;
        limit?: number;
        offset?: number;
    }): Promise<Podcast[]> {
        const response = await getPodcasts<PodcastResponse[]>({
            category: options?.category,
            limit: options?.limit,
            offset: options?.offset,
        });

        if (!response.success) {
            console.error('Failed to get podcasts:', response.error);
            return [];
        }

        return (response.data || []) as unknown as Podcast[];
    },

    /**
     * Get single podcast by ID with optional episodes
     */
    async getPodcast(id: string): Promise<Podcast | null> {
        const response = await getPodcasts<PodcastResponse>({
            podcastId: id,
            includeEpisodes: true,
        });

        if (!response.success) {
            console.error('Failed to get podcast:', response.error);
            return null;
        }

        return response.data as unknown as Podcast;
    },

    /**
     * Get episodes for a podcast
     */
    async getEpisodes(podcastId: string): Promise<Episode[]> {
        const response = await getPodcasts<PodcastResponse>({
            podcastId,
            includeEpisodes: true,
        });

        if (!response.success || !response.data) {
            console.error('Failed to get episodes:', response.error);
            return [];
        }

        return response.data.episodes || [];
    },

    /**
     * Get single episode by ID
     * Note: Direct episode fetch not implemented - episodes are fetched via parent podcast
     */
    async getEpisode(_id: string): Promise<Episode | null> {
        console.warn('getEpisode: Direct episode fetch not implemented in function');
        return null;
    },
};
