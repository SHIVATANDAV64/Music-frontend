/**
 * Jamendo API Service
 * Free music streaming API with 500k+ tracks
 * 
 * Docs: https://developer.jamendo.com/v3.0/docs
 * Get your API key from: https://devportal.jamendo.com
 */

const JAMENDO_CLIENT_ID = import.meta.env.VITE_JAMENDO_CLIENT_ID || '';
const JAMENDO_API_BASE = 'https://api.jamendo.com/v3.0';

if (!JAMENDO_CLIENT_ID) {
    console.warn('VITE_JAMENDO_CLIENT_ID not set in environment variables. Music API will not work.');
}

export interface JamendoTrack {
    id: string;
    name: string;
    artist_name: string;
    album_name: string;
    album_image: string;
    audio: string; // MP3 URL
    audiodownload: string; // Download URL
    duration: number;
    releasedate: string;
    license_ccurl: string;
}

export interface JamendoTracksResponse {
    headers: {
        status: string;
        code: number;
        error_message: string;
        warnings: string;
        results_count: number;
    };
    results: JamendoTrack[];
}

/**
 * Fetch tracks from Jamendo
 */
export async function getTracks(options: {
    limit?: number;
    offset?: number;
    order?: 'popularity_total' | 'releasedate' | 'name';
    tags?: string; // e.g. 'rock', 'pop', 'electronic'
    search?: string;
} = {}): Promise<JamendoTracksResponse> {
    const {
        limit = 20,
        offset = 0,
        order = 'popularity_total',
        tags,
        search,
    } = options;

    const params = new URLSearchParams({
        client_id: JAMENDO_CLIENT_ID,
        format: 'json',
        limit: limit.toString(),
        offset: offset.toString(),
        order,
        audioformat: 'mp32', // Get direct MP3 URLs
        include: 'musicinfo',
    });

    if (tags) {
        params.append('tags', tags);
    }

    if (search) {
        params.append('namesearch', search);
    }

    const url = `${JAMENDO_API_BASE}/tracks/?${params}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'MusicStreamingApp/1.0',
            },
        });

        if (!response.ok) {
            throw new Error(`Jamendo API error: ${response.status}`);
        }

        const data: JamendoTracksResponse = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch Jamendo tracks:', error);
        throw error;
    }
}

/**
 * Get tracks by tag/genre
 */
export async function getTracksByGenre(genre: string, limit = 20): Promise<JamendoTracksResponse> {
    return getTracks({
        tags: genre.toLowerCase(),
        limit,
        order: 'popularity_total',
    });
}

/**
 * Search tracks
 */
export async function searchTracks(query: string, limit = 20): Promise<JamendoTracksResponse> {
    return getTracks({
        search: query,
        limit,
    });
}

/**
 * Get popular tracks (default home page content)
 */
export async function getPopularTracks(limit = 20): Promise<JamendoTracksResponse> {
    return getTracks({
        limit,
        order: 'popularity_total',
    });
}

/**
 * Get trending/featured tracks - curated by Jamendo music managers
 * Uses featured flag and popularity boost for chart-like results
 */
export async function getTrendingTracks(limit = 20): Promise<JamendoTracksResponse> {
    const params = new URLSearchParams({
        client_id: JAMENDO_CLIENT_ID,
        format: 'json',
        limit: limit.toString(),
        featured: '1', // Only featured/curated tracks
        boost: 'popularity_total', // Boost by popularity for chart-like order
        audioformat: 'mp32',
    });

    const url = `${JAMENDO_API_BASE}/tracks/?${params}`;

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'MusicStreamingApp/1.0' },
        });
        if (!response.ok) throw new Error(`Jamendo API error: ${response.status}`);
        return response.json();
    } catch (error) {
        console.error('Failed to fetch trending tracks:', error);
        throw error;
    }
}

/**
 * Get featured tracks by genre - great for discovery sections
 * Combines genre tags with featured flag for quality results
 */
export async function getFeaturedByGenre(genre: string, limit = 10): Promise<JamendoTracksResponse> {
    const params = new URLSearchParams({
        client_id: JAMENDO_CLIENT_ID,
        format: 'json',
        limit: limit.toString(),
        tags: genre.toLowerCase(),
        featured: '1',
        groupby: 'artist_id', // Variety - one track per artist
        boost: 'popularity_total',
        audioformat: 'mp32',
    });

    const url = `${JAMENDO_API_BASE}/tracks/?${params}`;

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'MusicStreamingApp/1.0' },
        });
        if (!response.ok) throw new Error(`Jamendo API error: ${response.status}`);
        return response.json();
    } catch (error) {
        console.error(`Failed to fetch featured ${genre} tracks:`, error);
        throw error;
    }
}

/**
 * Available genres/tags
 */
export const JAMENDO_GENRES = [
    'rock',
    'pop',
    'electronic',
    'jazz',
    'classical',
    'hiphop',
    'metal',
    'reggae',
    'folk',
    'ambient',
    'indie',
    'country',
    'blues',
    'latin',
    'world',
] as const;

export type JamendoGenre = typeof JAMENDO_GENRES[number];

