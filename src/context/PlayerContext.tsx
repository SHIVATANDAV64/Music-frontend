/**
 * Player Context
 * Global audio player state management with Spotify-like queue functionality
 */
import { createContext, useContext, useReducer, useRef, useEffect, type ReactNode } from 'react';
import { storage, BUCKETS, getProxiedAudioUrlSync, fetchProxiedAudioBlob, isAudioProxied } from '../lib/appwrite';
import { historyService } from '../services';
import type { PlayableItem, PlayerState } from '../types';

// Action types
type PlayerAction =
    | { type: 'SET_TRACK'; payload: PlayableItem }
    | { type: 'PLAY' }
    | { type: 'PAUSE' }
    | { type: 'SET_PROGRESS'; payload: number }
    | { type: 'SET_DURATION'; payload: number }
    | { type: 'SET_VOLUME'; payload: number }
    | { type: 'SET_QUEUE'; payload: PlayableItem[] }
    | { type: 'ADD_TO_QUEUE'; payload: PlayableItem }
    | { type: 'NEXT' }
    | { type: 'PREVIOUS' }
    | { type: 'TOGGLE_SHUFFLE' }
    | { type: 'TOGGLE_REPEAT' }
    | { type: 'TOGGLE_MOOD_LIGHT' }
    | { type: 'TOGGLE_FULLSCREEN' }
    | { type: 'TOGGLE_AUDIO_CANVAS' };

interface PlayerContextType extends PlayerState {
    play: (item: PlayableItem) => void;
    pause: () => void;
    resume: () => void;
    seek: (time: number) => void;
    setVolume: (volume: number) => void;
    next: () => void;
    previous: () => void;
    addToQueue: (item: PlayableItem) => void;
    /** Set the entire queue - enables Spotify-like navigation */
    setQueue: (items: PlayableItem[]) => void;
    toggleShuffle: () => void;
    toggleRepeat: () => void;
    toggleMoodLight: () => void;
    toggleFullscreen: () => void;
    toggleAudioCanvas: () => void;
    audioRef: React.RefObject<HTMLAudioElement | null>;
    showMoodLight: boolean;
    showFullscreen: boolean;
    showAudioCanvas: boolean;
    currentTime: number;
    dispatch: React.Dispatch<PlayerAction>;
}

interface LocalState extends PlayerState {
    showMoodLight: boolean;
    showFullscreen: boolean;
    showAudioCanvas: boolean;
}

const initialState: LocalState = {
    currentTrack: null,
    isPlaying: false,
    progress: 0,
    duration: 0,
    volume: 0.7,
    queue: [],
    shuffle: false,
    repeat: 'none',
    showMoodLight: false,
    showFullscreen: false,
    showAudioCanvas: false,
};

function playerReducer(state: LocalState, action: PlayerAction): LocalState {
    switch (action.type) {
        case 'SET_TRACK': {
            const newTrack = action.payload;
            // If track is not in queue, add it. If queue is empty, create queue with this track.
            let newQueue = [...state.queue];
            const trackIndex = newQueue.findIndex(t => t.$id === newTrack.$id);
            if (trackIndex === -1) {
                // Track not in queue, add it
                newQueue = [...newQueue, newTrack];
            }
            return { ...state, currentTrack: newTrack, progress: 0, queue: newQueue };
        }
        case 'PLAY':
            return { ...state, isPlaying: true };
        case 'PAUSE':
            return { ...state, isPlaying: false };
        case 'SET_PROGRESS':
            return { ...state, progress: action.payload };
        case 'SET_DURATION':
            return { ...state, duration: action.payload };
        case 'SET_VOLUME':
            return { ...state, volume: action.payload };
        case 'SET_QUEUE':
            return { ...state, queue: action.payload };
        case 'ADD_TO_QUEUE':
            // Avoid duplicates
            if (state.queue.some(t => t.$id === action.payload.$id)) {
                return state;
            }
            return { ...state, queue: [...state.queue, action.payload] };
        case 'TOGGLE_SHUFFLE':
            return { ...state, shuffle: !state.shuffle };
        case 'TOGGLE_REPEAT':
            const repeatModes: PlayerState['repeat'][] = ['none', 'one', 'all'];
            const currentIndex = repeatModes.indexOf(state.repeat);
            return { ...state, repeat: repeatModes[(currentIndex + 1) % 3] };
        case 'NEXT': {
            if (!state.currentTrack || state.queue.length === 0) return state;
            const currentIdx = state.queue.findIndex(t => t.$id === state.currentTrack?.$id);

            // If current track not found in queue, use first track
            if (currentIdx === -1) {
                return { ...state, currentTrack: state.queue[0], progress: 0 };
            }

            let nextIdx: number;
            if (state.shuffle) {
                // Shuffle: pick random different track
                do {
                    nextIdx = Math.floor(Math.random() * state.queue.length);
                } while (nextIdx === currentIdx && state.queue.length > 1);
            } else {
                nextIdx = currentIdx + 1;
                if (nextIdx >= state.queue.length) {
                    nextIdx = state.repeat === 'all' ? 0 : currentIdx;
                }
            }
            return { ...state, currentTrack: state.queue[nextIdx], progress: 0 };
        }
        case 'PREVIOUS': {
            if (!state.currentTrack || state.queue.length === 0) return state;
            const currentIdx = state.queue.findIndex(t => t.$id === state.currentTrack?.$id);

            // If current track not found in queue, use last track
            if (currentIdx === -1) {
                return { ...state, currentTrack: state.queue[state.queue.length - 1], progress: 0 };
            }

            let prevIdx: number;
            if (state.shuffle) {
                // Shuffle: pick random different track
                do {
                    prevIdx = Math.floor(Math.random() * state.queue.length);
                } while (prevIdx === currentIdx && state.queue.length > 1);
            } else {
                prevIdx = currentIdx > 0 ? currentIdx - 1 : (state.repeat === 'all' ? state.queue.length - 1 : currentIdx);
            }
            return { ...state, currentTrack: state.queue[prevIdx], progress: 0 };
        }
        case 'TOGGLE_MOOD_LIGHT':
            return { ...state, showMoodLight: !state.showMoodLight };
        case 'TOGGLE_FULLSCREEN':
            return { ...state, showFullscreen: !state.showFullscreen };
        case 'TOGGLE_AUDIO_CANVAS':
            return { ...state, showAudioCanvas: !state.showAudioCanvas };
        default:
            return state;
    }
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(playerReducer, initialState);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize audio element
    useEffect(() => {
        audioRef.current = new Audio();
        audioRef.current.volume = state.volume;

        const audio = audioRef.current;

        const handleTimeUpdate = () => {
            dispatch({ type: 'SET_PROGRESS', payload: audio.currentTime });
        };

        const handleLoadedMetadata = () => {
            dispatch({ type: 'SET_DURATION', payload: audio.duration });
        };

        const handleEnded = () => {
            if (state.repeat === 'one') {
                audio.currentTime = 0;
                audio.play();
            } else {
                dispatch({ type: 'NEXT' });
            }
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.pause();
        };
    }, [state.repeat]);

    // Play when track changes
    // Two-phase approach:
    // 1. Start playing immediately with original URL (fast playback)
    // 2. Fetch proxied blob URL in background (enables visualization)
    // 3. Switch to blob URL when ready (seamless, enables Web Audio API)
    useEffect(() => {
        if (state.currentTrack && audioRef.current) {
            let audioUrl: string;
            let isExternalSource = false;
            let originalExternalUrl: string | null = null;

            if ('audio_url' in state.currentTrack && state.currentTrack.audio_url) {
                // Jamendo or external API tracks
                originalExternalUrl = state.currentTrack.audio_url;
                // Check if we already have a cached blob URL
                audioUrl = getProxiedAudioUrlSync(originalExternalUrl);
                isExternalSource = true;
            } else if ('audio_file_id' in state.currentTrack && state.currentTrack.audio_file_id) {
                // Appwrite uploaded tracks - direct access
                audioUrl = storage.getFileView(BUCKETS.AUDIO, state.currentTrack.audio_file_id).toString();
                isExternalSource = false;
            } else {
                console.error('No audio source available for track');
                return;
            }

            // For external sources: start with original URL, fetch proxy in background
            // For Appwrite sources: set crossOrigin for immediate visualization
            if (isExternalSource) {
                // Check if blob URL is already cached
                if (isAudioProxied(originalExternalUrl!)) {
                    // Use cached blob URL - enables visualization
                    audioRef.current.crossOrigin = 'anonymous';
                } else {
                    // Start without crossOrigin for immediate playback
                    audioRef.current.removeAttribute('crossorigin');

                    // Fetch proxied blob in background for future visualization
                    fetchProxiedAudioBlob(originalExternalUrl!).then((blobUrl) => {
                        // If still playing the same track and we got a blob URL
                        if (
                            audioRef.current &&
                            state.currentTrack &&
                            'audio_url' in state.currentTrack &&
                            state.currentTrack.audio_url === originalExternalUrl &&
                            blobUrl !== originalExternalUrl
                        ) {
                            // Store current playback position
                            const currentTime = audioRef.current.currentTime;
                            const wasPlaying = !audioRef.current.paused;

                            // Switch to blob URL (enables visualization)
                            console.log('[Player] Switching to proxied blob URL for visualization');
                            audioRef.current.crossOrigin = 'anonymous';
                            audioRef.current.src = blobUrl;
                            audioRef.current.currentTime = currentTime;

                            if (wasPlaying) {
                                audioRef.current.play().catch(console.error);
                            }
                        }
                    }).catch((err) => {
                        console.warn('[Player] Failed to fetch proxied audio:', err);
                        // Continue with original URL - audio plays, just no visualization
                    });
                }
            } else {
                // Appwrite sources always support CORS
                audioRef.current.crossOrigin = 'anonymous';
            }

            audioRef.current.src = audioUrl;
            audioRef.current.load();
            audioRef.current.play()
                .then(() => {
                    dispatch({ type: 'PLAY' });
                    // Record this play in history
                    const isEpisode = 'episode_id' in state.currentTrack!;
                    const trackSource = 'audio_url' in state.currentTrack! ? 'jamendo' : 'appwrite';
                    historyService.recordPlay(state.currentTrack!.$id, isEpisode, trackSource);
                })
                .catch((err) => {
                    console.error('Failed to play audio:', err);
                });
        }
    }, [state.currentTrack?.$id]);

    // Volume change handler
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = state.volume;
        }
    }, [state.volume]);

    function play(item: PlayableItem) {
        dispatch({ type: 'SET_TRACK', payload: item });
    }

    function pause() {
        // Save position before pausing
        if (state.currentTrack && audioRef.current) {
            const isEpisode = 'episode_id' in state.currentTrack;
            historyService.updatePosition(state.currentTrack.$id, audioRef.current.currentTime, isEpisode);
        }
        audioRef.current?.pause();
        dispatch({ type: 'PAUSE' });
    }

    function resume() {
        audioRef.current?.play();
        dispatch({ type: 'PLAY' });
    }

    function seek(time: number) {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            dispatch({ type: 'SET_PROGRESS', payload: time });
        }
    }

    function setVolume(volume: number) {
        dispatch({ type: 'SET_VOLUME', payload: volume });
    }

    function next() {
        dispatch({ type: 'NEXT' });
    }

    function previous() {
        dispatch({ type: 'PREVIOUS' });
    }

    function addToQueue(item: PlayableItem) {
        dispatch({ type: 'ADD_TO_QUEUE', payload: item });
    }

    /**
     * Set the entire playback queue - Spotify-like pattern
     * Call this when loading a list of tracks to enable seamless next/previous
     */
    function setQueue(items: PlayableItem[]) {
        dispatch({ type: 'SET_QUEUE', payload: items });
    }

    function toggleShuffle() {
        dispatch({ type: 'TOGGLE_SHUFFLE' });
    }

    function toggleRepeat() {
        dispatch({ type: 'TOGGLE_REPEAT' });
    }

    function toggleMoodLight() {
        dispatch({ type: 'TOGGLE_MOOD_LIGHT' });
    }

    function toggleFullscreen() {
        dispatch({ type: 'TOGGLE_FULLSCREEN' });
    }

    function toggleAudioCanvas() {
        dispatch({ type: 'TOGGLE_AUDIO_CANVAS' });
    }

    return (
        <PlayerContext.Provider
            value={{
                ...state,
                play,
                pause,
                resume,
                seek,
                setVolume,
                next,
                previous,
                addToQueue,
                setQueue,
                toggleShuffle,
                toggleRepeat,
                toggleMoodLight,
                toggleFullscreen,
                toggleAudioCanvas,
                audioRef,
                showMoodLight: state.showMoodLight,
                showFullscreen: state.showFullscreen,
                showAudioCanvas: state.showAudioCanvas,
                currentTime: state.progress,
                dispatch,
            }}
        >
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
}
