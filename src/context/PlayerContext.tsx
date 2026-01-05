/**
 * Player Context
 * Global audio player state management with Spotify-like queue functionality
 */
import { createContext, useContext, useReducer, useRef, useEffect, type ReactNode } from 'react';
import { storage, BUCKETS, getProxiedAudioUrlSync } from '../lib/appwrite';
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
    useEffect(() => {
        if (state.currentTrack && audioRef.current) {
            // Use direct audio_url if available (Jamendo), otherwise use Appwrite storage
            let audioUrl: string;

            if ('audio_url' in state.currentTrack && state.currentTrack.audio_url) {
                // Jamendo or external API tracks - use original URL for playback
                // Note: Web Audio API visualization may be limited due to CORS on external sources
                audioUrl = getProxiedAudioUrlSync(state.currentTrack.audio_url);
            } else if ('audio_file_id' in state.currentTrack && state.currentTrack.audio_file_id) {
                // Appwrite uploaded tracks - direct access, full visualization support
                audioUrl = storage.getFileView(BUCKETS.AUDIO, state.currentTrack.audio_file_id).toString();
            } else {
                console.error('No audio source available for track');
                return;
            }

            // Set crossOrigin for CORS (required for Web Audio API visualization)
            // Note: This may not work for all external sources
            audioRef.current.crossOrigin = 'anonymous';
            audioRef.current.src = audioUrl;

            // Reset connection attempt flag when source changes to allow re-initialization
            // This is handled by the AudioAnalyzerContext watching audioRef.current?.src

            audioRef.current.load(); // Explicitly load the new source
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
                    // If autoplay fails, user interaction is required
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
