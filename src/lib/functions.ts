/**
 * Appwrite Functions API Utility
 * All function IDs come from environment variables - NEVER hardcoded
 */

// Function IDs from environment variables
const FUNCTION_IDS = {
    GET_TRACKS: import.meta.env.VITE_FUNCTION_GET_TRACKS,
    GET_PODCASTS: import.meta.env.VITE_FUNCTION_GET_PODCASTS,
    MANAGE_PLAYLISTS: import.meta.env.VITE_FUNCTION_MANAGE_PLAYLISTS,
    MANAGE_FAVORITES: import.meta.env.VITE_FUNCTION_MANAGE_FAVORITES,
    RECORD_HISTORY: import.meta.env.VITE_FUNCTION_RECORD_HISTORY,
    ADMIN_UPLOAD: import.meta.env.VITE_FUNCTION_ADMIN_UPLOAD,
    SEARCH: import.meta.env.VITE_FUNCTION_SEARCH,
    AUDIO_PROXY: import.meta.env.VITE_FUNCTION_AUDIO_PROXY,
} as const;

export type FunctionId = string;

// Response types
export interface FunctionResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    total?: number;
    hasMore?: boolean;
}

// Get Appwrite config from environment
const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;

/**
 * Execute an Appwrite Function
 * @param functionId - The function ID from environment variable
 * @param body - Request body
 * @returns Typed response from the function
 */
export async function callFunction<T>(
    functionId: string,
    body: object = {}
): Promise<FunctionResponse<T>> {
    if (!functionId) {
        console.error('Function ID not configured in environment variables');
        return { success: false, error: 'Function ID not configured' };
    }

    const url = `${ENDPOINT}/functions/${functionId}/executions`;

    try {
        const sessionToken = localStorage.getItem('appwrite_session');

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': PROJECT_ID,
        };

        if (sessionToken) {
            headers['X-Appwrite-Session'] = sessionToken;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                body: JSON.stringify(body),
                async: false,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Function execution failed: ${response.status}`);
        }

        const result = await response.json();

        if (result.responseBody) {
            try {
                return JSON.parse(result.responseBody);
            } catch {
                return { success: false, error: 'Failed to parse function response' };
            }
        }

        return { success: false, error: 'No response from function' };

    } catch (error) {
        console.error(`Function call failed:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

// Type-safe function callers - all use env vars for IDs

export type PlaylistAction = 'create' | 'read' | 'update' | 'delete' | 'add_track' | 'remove_track' | 'list';

export interface PlaylistParams {
    action: PlaylistAction;
    playlistId?: string;
    name?: string;
    description?: string;
    trackId?: string;
    trackSource?: 'jamendo' | 'appwrite';
    position?: number;
}

export function managePlaylists<T>(params: PlaylistParams) {
    return callFunction<T>(FUNCTION_IDS.MANAGE_PLAYLISTS, params as object);
}

export type FavoritesAction = 'add' | 'remove' | 'toggle' | 'list' | 'check' | 'get_ids';

export interface FavoritesParams {
    action: FavoritesAction;
    trackId?: string;
    trackSource?: 'jamendo' | 'appwrite';
    limit?: number;
    offset?: number;
}

export function manageFavorites<T>(params: FavoritesParams) {
    return callFunction<T>(FUNCTION_IDS.MANAGE_FAVORITES, params as object);
}

export interface PodcastParams {
    podcastId?: string;
    category?: string;
    limit?: number;
    offset?: number;
    includeEpisodes?: boolean;
}

export function getPodcasts<T>(params: PodcastParams = {}) {
    return callFunction<T>(FUNCTION_IDS.GET_PODCASTS, params as object);
}

export type HistoryAction = 'record' | 'update_position' | 'get_history' | 'get_resume' | 'clear';

export interface HistoryParams {
    action: HistoryAction;
    itemId?: string;
    isEpisode?: boolean;
    position?: number;
    limit?: number;
}

export function recordHistory<T>(params: HistoryParams) {
    return callFunction<T>(FUNCTION_IDS.RECORD_HISTORY, params as object);
}

export interface SearchParams {
    query: string;
    types?: ('tracks' | 'podcasts' | 'episodes')[];
    limit?: number;
}

export function searchContent<T>(params: SearchParams) {
    return callFunction<T>(FUNCTION_IDS.SEARCH, params as object);
}

export interface AdminUploadParams {
    contentType: 'track' | 'podcast' | 'episode';
    data: Record<string, unknown>;
}

export function adminUpload<T>(params: AdminUploadParams) {
    return callFunction<T>(FUNCTION_IDS.ADMIN_UPLOAD, params as object);
}

// Export for audio proxy URL generation
export function getAudioProxyFunctionId(): string {
    return FUNCTION_IDS.AUDIO_PROXY;
}
