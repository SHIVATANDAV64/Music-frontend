import { functions } from './appwrite';

// Response types
export interface FunctionResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    total?: number;
    hasMore?: boolean;
}

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

// Initialize Appwrite Functions SDK
// const functions = new Functions(client); // This line is removed as 'functions' is now imported

// Response types
// export interface FunctionResponse<T = unknown> { // This interface is now imported
//     success: boolean;
//     data?: T;
//     error?: string;
//     total?: number;
//     hasMore?: boolean;
// }

/**
 * Execute an Appwrite Function using the SDK
 * The SDK automatically handles session authentication
 * @param functionId - The function ID from environment variable
 * @param body - Request body
 * @returns Typed response from the function
 */
export async function callFunction<T>(
    functionId: string,
    body: object = {}
): Promise<FunctionResponse<T>> {
    try {
        const execution = await functions.createExecution(
            functionId,
            JSON.stringify(body),
            false // async = false
        );

        if (execution.status === 'completed') {
            try {
                if (!execution.responseBody) {
                    return { success: true, data: null as any };
                }
                const response = JSON.parse(execution.responseBody);
                return { success: true, data: response as T };
            } catch (e) {
                console.error(`[Functions] Parse error for ${functionId}:`, e);
                console.debug(`[Functions] Raw response:`, execution.responseBody);
                return { success: false, error: 'Invalid JSON response from function' };
            }
        }

        if (execution.status === 'failed') {
            console.error(`[Functions] ${functionId} FAILED:`, execution.errors);
            return { success: false, error: execution.errors || 'Function execution failed' };
        }

        // Handle cases like 'waiting', 'processing' which shouldn't happen for sync calls
        console.warn(`[Functions] ${functionId} returned unexpected status: ${execution.status}`);
        return { success: false, error: `Function returned status: ${execution.status}` };
    } catch (error: any) {
        // Detailed logging for CORS/503 errors
        console.error(`[Functions] Exception calling ${functionId}:`, {
            message: error.message,
            code: error.code,
            type: error.type
        });

        if (error.message?.includes('fetch') || error.code === 503) {
            return {
                success: false,
                error: 'Service currently unavailable. Please check your Appwrite Console for function health or CORS settings.'
            };
        }

        return { success: false, error: error.message || 'Failed to call function' };
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
    metadata?: any;
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
    metadata?: any;
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
    metadata?: any;
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
