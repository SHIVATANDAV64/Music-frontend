/**
 * Player Context
 * Global audio player state management with Spotify-like queue functionality
 */
import { createContext, useContext, useReducer, type ReactNode } from 'react';
import { historyService } from '../services';
import type { PlayableItem, PlayerState } from '../types';
import { useAudioElement } from '../hooks/useAudioElement';

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
    | { type: 'TOGGLE_AUDIO_CANVAS' }
    | { type: 'REMOVE_FROM_QUEUE'; payload: string }
    | { type: 'CLEAR_QUEUE' };

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
    removeFromQueue: (trackId: string) => void;
    clearQueue: () => void;
    audio: HTMLAudioElement;
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
        case 'REMOVE_FROM_QUEUE': {
            const trackIdToRemove = action.payload;
            const newQueue = state.queue.filter(t => t.$id !== trackIdToRemove);

            // If we removed the currently playing track, we might want to skip to next
            // but usually remove just removes it from the list. 
            // If the track being removed is current, we keep it playing but it's no longer in queue.
            // This matches Spotify behavior (removing current track from queue doesn't stop playback).
            return { ...state, queue: newQueue };
        }
        case 'CLEAR_QUEUE':
            // Keep current track but clear everything else? Or clear everything?
            // Spotify keeps current track.
            return { ...state, queue: state.currentTrack ? [state.currentTrack] : [] };
        default:
            return state;
    }
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(playerReducer, initialState);

    const { audio, audioRef, seek } = useAudioElement({
        currentTrack: state.currentTrack,
        volume: state.volume,
        repeatMode: state.repeat,
        shuffle: state.shuffle,
        onProgress: (time) => dispatch({ type: 'SET_PROGRESS', payload: time }),
        onDuration: (duration) => dispatch({ type: 'SET_DURATION', payload: duration }),
        onEnded: () => { /* Handle ended if needed specifically, but hook handles NEXT/REPEAT */ },
        onPlay: () => dispatch({ type: 'PLAY' }),
        onPause: () => dispatch({ type: 'PAUSE' }),
        onNext: () => dispatch({ type: 'NEXT' })
    });

    function play(item: PlayableItem) {
        dispatch({ type: 'SET_TRACK', payload: item });
    }

    function pause() {
        // Save position before pausing
        if (state.currentTrack) {
            const isEpisode = 'episode_id' in state.currentTrack;
            historyService.updatePosition(state.currentTrack.$id, audio.currentTime, isEpisode);
        }
        audio.pause();
        dispatch({ type: 'PAUSE' });
    }

    function resume() {
        audio.play();
        dispatch({ type: 'PLAY' });
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

    function removeFromQueue(trackId: string) {
        dispatch({ type: 'REMOVE_FROM_QUEUE', payload: trackId });
    }

    function clearQueue() {
        dispatch({ type: 'CLEAR_QUEUE' });
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
                removeFromQueue,
                clearQueue,
                audio,
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

