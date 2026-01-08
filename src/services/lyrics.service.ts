/**
 * Lyrics Service - Stub Implementation
 * TODO: Implement actual lyrics fetching from an API
 */

export interface LyricsLine {
    time: number;
    text: string;
}

export interface LyricsResult {
    syncedLyrics?: LyricsLine[];
    plainLyrics?: string;
    instrumental?: boolean;
}

/**
 * Get lyrics for a track
 * Currently returns null - lyrics API integration needed
 */
export async function getLyrics(_trackName: string, _artistName: string): Promise<LyricsResult | null> {
    // TODO: Integrate with a lyrics API like LRCLIB, Genius, or Musixmatch


    // Return null to indicate no lyrics found
    return null;
}
