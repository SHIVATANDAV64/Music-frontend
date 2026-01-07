/**
 * Track Utilities - Source-aware helpers
 * Handle both Jamendo and Appwrite track sources
 */

import { storage, BUCKETS } from '../lib/appwrite';
import type { Track } from '../types';

/**
 * Get the audio URL for a track based on its source
 */
export function getTrackAudioUrl(track: Track): string | null {
    // 1. If it has a direct external URL (Jamendo ingest), use it
    if (track.audio_url && track.audio_url.startsWith('http')) {
        return track.audio_url;
    }

    // 2. If it's a true Appwrite upload (or manual ingest without external URL), use Storage
    if (track.audio_file_id) {
        return storage.getFileView(BUCKETS.AUDIO, track.audio_file_id).toString();
    }

    // 3. Last attempt: check for jamendo source without explicit URL (shouldn't happen with new logic)
    if (track.source === 'jamendo' && track.audio_url) {
        return track.audio_url;
    }

    return null;
}

/**
 * Get the cover image URL for a track based on its source
 */
export function getTrackCoverUrl(track: Track, width = 400, height = 400): string | null {
    // 1. If it has a direct external URL (Jamendo ingest), use it
    if (track.cover_url && track.cover_url.startsWith('http')) {
        return track.cover_url;
    }

    // 2. If it's a true Appwrite upload, use Storage
    if (track.cover_image_id) {
        return storage.getFilePreview(BUCKETS.COVERS, track.cover_image_id, width, height).toString();
    }

    // 3. Fallback for pure Jamendo objects (search results)
    if (track.source === 'jamendo') {
        return track.cover_url || null;
    }

    return null;
}

/**
 * Check if track is from Jamendo
 */
export function isJamendoTrack(track: Track): boolean {
    return track.source === 'jamendo';
}

/**
 * Check if track is from Appwrite (user uploaded)
 */
export function isAppwriteTrack(track: Track): boolean {
    return track.source === 'appwrite';
}
