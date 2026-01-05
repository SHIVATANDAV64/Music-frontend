/**
 * History Service
 * Manages recently played and resume playback functionality
 */
import { recordHistory } from '../lib/functions';

export interface RecentlyPlayedItem {
    $id: string;
    track_id?: string;
    episode_id?: string;
    played_at: string;
    resume_position: number;
    track_source?: 'jamendo' | 'appwrite';
}

export interface ResumeData {
    itemId: string;
    position: number;
    isEpisode: boolean;
}

export const historyService = {
    /**
     * Record that a track/episode was played
     * Call this when playback starts
     */
    async recordPlay(
        itemId: string,
        isEpisode: boolean = false,
        _trackSource: 'jamendo' | 'appwrite' = 'jamendo' // Reserved for future track source recording
    ): Promise<boolean> {
        const response = await recordHistory<{ success: boolean }>({
            action: 'record',
            itemId,
            isEpisode,
        });
        return response.success;
    },

    /**
     * Update resume position for current item
     * Call this periodically during playback and on pause
     */
    async updatePosition(
        itemId: string,
        position: number,
        isEpisode: boolean = false
    ): Promise<boolean> {
        const response = await recordHistory<{ success: boolean }>({
            action: 'update_position',
            itemId,
            position: Math.floor(position),
            isEpisode,
        });
        return response.success;
    },

    /**
     * Get recently played items for the current user
     */
    async getRecentlyPlayed(limit: number = 20): Promise<RecentlyPlayedItem[]> {
        const response = await recordHistory<RecentlyPlayedItem[]>({
            action: 'get_history',
            limit,
        });

        if (!response.success || !response.data) {
            return [];
        }

        return response.data;
    },

    /**
     * Get resume position for a specific item
     */
    async getResumePosition(
        itemId: string,
        isEpisode: boolean = false
    ): Promise<number | null> {
        const response = await recordHistory<{ position: number }>({
            action: 'get_resume',
            itemId,
            isEpisode,
        });

        if (!response.success || !response.data) {
            return null;
        }

        return response.data.position;
    },

    /**
     * Clear all history for the current user
     */
    async clearHistory(): Promise<boolean> {
        const response = await recordHistory<{ success: boolean }>({
            action: 'clear',
        });
        return response.success;
    },
};
