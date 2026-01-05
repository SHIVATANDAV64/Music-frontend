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
    if (track.source === 'jamendo') {
        return track.audio_url || null;
    }
    if (track.source === 'appwrite' && track.audio_file_id) {
        return storage.getFileView(BUCKETS.AUDIO, track.audio_file_id).toString();
    }
    return null;
}

/**
 * Get the cover image URL for a track based on its source
 */
export function getTrackCoverUrl(track: Track, width = 400, height = 400): string | null {
    if (track.source === 'jamendo') {
        return track.cover_url || null;
    }
    if (track.source === 'appwrite' && track.cover_image_id) {
        return storage.getFilePreview(BUCKETS.COVERS, track.cover_image_id, width, height).toString();
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
