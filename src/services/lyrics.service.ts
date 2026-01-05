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
export async function getLyrics(trackName: string, artistName: string): Promise<LyricsResult | null> {
    // TODO: Integrate with a lyrics API like LRCLIB, Genius, or Musixmatch
    console.log(`Lyrics requested for: ${trackName} by ${artistName}`);

    // Return null to indicate no lyrics found
    return null;
}
