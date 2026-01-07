/**
 * Type Definitions for Music Streaming App
 * Matches Appwrite database schema
 */

// Base document type from Appwrite
export interface AppwriteDocument {
    $id: string;
    $createdAt: string;
    $updatedAt: string;
    $permissions: string[];
    $databaseId: string;
    $collectionId: string;
}

// User profile (extends Appwrite Auth user)
export interface User extends AppwriteDocument {
    username: string;
    email?: string;
    avatar_url?: string;
    is_admin: boolean;
}

// Music track - supports both Jamendo (external) and Appwrite (uploaded) sources
export type TrackSource = 'jamendo' | 'appwrite';

export interface Track extends AppwriteDocument {
    title: string;
    artist: string;
    album?: string;
    genre?: string;
    duration: number; // seconds
    play_count: number;

    // SOURCE DISCRIMINATION - determines how to fetch audio/cover
    source: TrackSource;

    // For Jamendo tracks (external API)
    jamendo_id?: string;      // Original Jamendo track ID
    audio_url?: string;       // Direct MP3 URL
    cover_url?: string;       // Direct image URL

    // For Appwrite tracks (user uploads)
    audio_file_id?: string;   // Appwrite Storage ID
    audio_filename?: string;  // Descriptive filename
    cover_image_id?: string;  // Appwrite Storage ID
    cover_filename?: string;  // Descriptive filename
}

// Podcast show
export interface Podcast extends AppwriteDocument {
    title: string;
    description?: string;
    author: string;
    cover_image_id?: string;
    category?: string;
}

// Podcast episode
export interface Episode extends AppwriteDocument {
    podcast_id: string;
    title: string;
    description?: string;
    duration: number; // seconds
    audio_file_id: string;
    episode_number?: number;
}

// User playlist
export interface Playlist extends AppwriteDocument {
    user_id: string;
    name: string;
    description?: string;
    is_public: boolean;
    cover_image_id?: string;
    tracks?: Track[]; // Inflated by service
}

// Playlist track join table
export interface PlaylistTrack extends AppwriteDocument {
    playlist_id: string;
    track_id: string;
    track_source: TrackSource; // NEW: Store which source the track comes from
    position: number;
}

// Recently played item
export interface RecentlyPlayed extends AppwriteDocument {
    user_id: string;
    track_id?: string;
    episode_id?: string;
    last_position: number; // seconds
    played_at: string; // ISO datetime
}

// Favorited track
export interface Favorite extends AppwriteDocument {
    user_id: string;
    track_id: string;
    track_source: TrackSource; // NEW: Store which source the track comes from
}

// Playable item union type
export type PlayableItem = Track | Episode;

// Player state
export interface PlayerState {
    currentTrack: PlayableItem | null;
    isPlaying: boolean;
    progress: number;
    duration: number;
    volume: number;
    queue: PlayableItem[];
    shuffle: boolean;
    repeat: 'none' | 'one' | 'all';
}

// Auth state
export interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}
