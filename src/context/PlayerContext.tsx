/**
 * Player Context
 * Global audio player state management with Spotify-like queue functionality
 */
import { createContext, useContext, useReducer, useRef, useEffect, useState, type ReactNode } from 'react';
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
        default:
            return state;
    }
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(playerReducer, initialState);

    // Use state for the audio element so components can react to instance swaps
    const [audio, setAudio] = useState<HTMLAudioElement>(() => {
        const a = new Audio();
        a.volume = initialState.volume;
        a.preload = 'auto'; // Improve initial buffering
        return a;
    });

    // Provide a ref for legacy/compatibility
    const audioRef = useRef<HTMLAudioElement | null>(audio);

    // Sync ref with audio state
    useEffect(() => {
        audioRef.current = audio;
    }, [audio]);

    // Use ref for repeat to avoid recreating audio element
    const repeatRef = useRef(state.repeat);
    const shuffleRef = useRef(state.shuffle);
    const isSeekingRef = useRef(false);

    // Keep refs in sync with state
    useEffect(() => {
        repeatRef.current = state.repeat;
    }, [state.repeat]);

    useEffect(() => {
        shuffleRef.current = state.shuffle;
    }, [state.shuffle]);

    // Unified function to attach listeners to an audio element
    const attachAudioListeners = (audio: HTMLAudioElement) => {
        const handleTimeUpdate = () => {
            if (!isSeekingRef.current) {
                dispatch({ type: 'SET_PROGRESS', payload: audio.currentTime });
            }
        };

        const handleLoadedMetadata = () => {
            dispatch({ type: 'SET_DURATION', payload: audio.duration });
        };

        const handleEnded = () => {
            if (repeatRef.current === 'one') {
                audio.currentTime = 0;
                audio.play();
            } else {
                dispatch({ type: 'NEXT' });
            }
        };

        const handleCanPlay = () => {
            const targetSeek = (audio as any)._targetSeek;
            if (targetSeek !== undefined) {
                console.log('[Player] Applying deferred seek to:', targetSeek);
                audio.currentTime = targetSeek;
                delete (audio as any)._targetSeek;
            }
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('canplay', handleCanPlay);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('canplay', handleCanPlay);
        };
    };

    // Initialize audio listeners whenever the audio element instance changes
    useEffect(() => {
        const cleanup = attachAudioListeners(audio);
        return () => {
            cleanup();
            audio.pause();
            audio.src = '';
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audio]);

    // Play when track changes
    // Two-phase approach:
    // 1. Start playing immediately with original URL (fast playback)
    // 2. Fetch proxied blob URL in background (enables visualization)
    // 3. Switch to blob URL when ready (seamless, enables Web Audio API)
    // Play when track changes
    // Robust implementation with race condition handling
    const playbackRequestId = useRef(0);
    const playPromiseRef = useRef<Promise<void> | null>(null);

    useEffect(() => {
        if (state.currentTrack) {
            const currentRequestId = ++playbackRequestId.current;

            const startPlayback = async () => {
                // 1. Determine safe Audio URL
                let audioUrl: string = '';
                let isExternalSource = false;
                let originalExternalUrl: string | null = null;

                try {

                    if ('audio_url' in state.currentTrack! && state.currentTrack.audio_url) {
                        originalExternalUrl = state.currentTrack.audio_url;
                        // Synchronously check if we have a proxied version ready
                        audioUrl = getProxiedAudioUrlSync(originalExternalUrl);
                        isExternalSource = true;
                    } else if ('audio_file_id' in state.currentTrack! && state.currentTrack.audio_file_id) {
                        audioUrl = storage.getFileView(BUCKETS.AUDIO, state.currentTrack.audio_file_id).toString();
                        isExternalSource = false;
                    } else {
                        throw new Error('No audio source found');
                    }

                    // 1. Determine if we need a fresh audio element to prevent silence
                    // If the current element has been "captured" by AudioContext, it will be silent 
                    // for any non-proxied jamendo tracks. We reset it to ensure playback works.
                    let currentAudio = audio;
                    const isElementCaptured = (currentAudio as any)._isCaptured;

                    if (isElementCaptured && isExternalSource && !audioUrl.startsWith('blob:')) {
                        console.log('[Player] Resetting audio element to prevent context redirection silence');
                        currentAudio.pause();
                        currentAudio.src = '';

                        // Create NEW element
                        const newAudio = new Audio();
                        newAudio.volume = state.volume;
                        newAudio.preload = 'auto';
                        setAudio(newAudio); // This triggers re-render and listener attachment
                        currentAudio = newAudio;
                    } else {
                        currentAudio.pause();
                    }

                    // Don't await previous play promise, just catch any resulting 'interrupted' errors
                    if (playPromiseRef.current) {
                        playPromiseRef.current.catch(() => { });
                    }

                    if (playbackRequestId.current !== currentRequestId) return;

                    currentAudio.currentTime = 0;

                    // Configure CrossOrigin
                    // We start with NO crossOrigin for Jamendo to ensure playback works, then upgrade later.
                    if (isExternalSource && !isAudioProxied(originalExternalUrl!)) {
                        currentAudio.removeAttribute('crossorigin');
                    } else {
                        currentAudio.crossOrigin = 'anonymous';
                    }

                    currentAudio.src = audioUrl;
                    currentAudio.load();

                    // 3. Play
                    const playPromise = currentAudio.play();
                    playPromiseRef.current = playPromise;

                    await playPromise;

                    if (playbackRequestId.current === currentRequestId) {
                        dispatch({ type: 'PLAY' });

                        // History recording
                        const isEpisode = 'episode_id' in state.currentTrack!;
                        const trackSource = 'audio_url' in state.currentTrack! ? 'jamendo' : 'appwrite';
                        historyService.recordPlay(state.currentTrack!.$id, isEpisode, trackSource);
                    }

                    // 4. Background Proxy Upgrade (for Visualization)
                    if (isExternalSource && !isAudioProxied(originalExternalUrl!) && playbackRequestId.current === currentRequestId) {
                        try {
                            // Fetch blob in background
                            const blobUrl = await fetchProxiedAudioBlob(originalExternalUrl!);

                            // Check if still playing the same track
                            if (playbackRequestId.current === currentRequestId && currentAudio.src !== blobUrl) {
                                console.log('[Player] Upgrading to proxied blob for visualization');
                                const currentTime = currentAudio.currentTime;
                                const wasPlaying = !currentAudio.paused;

                                currentAudio.crossOrigin = 'anonymous';
                                currentAudio.src = blobUrl;
                                currentAudio.currentTime = currentTime;

                                if (wasPlaying) {
                                    const resumePromise = currentAudio.play();
                                    playPromiseRef.current = resumePromise;
                                    await resumePromise.catch((e: Error) => {
                                        if (e.name !== 'AbortError') console.warn('Resume failed:', e);
                                    });
                                }
                            }
                        } catch (err) {
                            console.warn('[Player] Proxy upgrade failed, continuing with original:', err);
                        }
                    }

                } catch (err: any) {
                    if (playbackRequestId.current === currentRequestId) {
                        if (err.name === 'AbortError') {
                            // Expected during rapid skipping
                            console.debug('[Player] Playback aborted by new request');
                        } else {
                            console.error('[Player] Playback failed:', err);

                            // Fallback: Try proxy if original source failed (e.g. 404)
                            if (isExternalSource && !audioUrl.startsWith('blob:')) {
                                console.log('[Player] Original source failed, attempting proxy fallback...');
                                try {
                                    const blobUrl = await fetchProxiedAudioBlob(originalExternalUrl!);

                                    // Verify we are still on the same track request
                                    if (playbackRequestId.current === currentRequestId) {
                                        audio.crossOrigin = 'anonymous';
                                        audio.src = blobUrl;
                                        audio.load();
                                        await audio.play();
                                        dispatch({ type: 'PLAY' });
                                        return; // Recovered successfully
                                    }
                                } catch (proxyErr) {
                                    console.warn('[Player] Proxy fallback also failed:', proxyErr);
                                }
                            }

                            // Auto-skip if playback failed completely
                            console.warn('[Player] Track unavailable, skipping to next...');
                            setTimeout(() => {
                                dispatch({ type: 'NEXT' });
                            }, 1500);
                        }
                    }
                }
            };

            startPlayback();
        }
    }, [state.currentTrack?.$id]);

    // Volume change handler
    useEffect(() => {
        audio.volume = state.volume;
    }, [state.volume, audio]);

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

    function seek(time: number) {
        if (!audio) return;

        const duration = audio.duration;
        if (!Number.isFinite(duration) || duration === 0) {
            console.warn('[Player] Cannot seek: Duration is invalid or not yet loaded:', duration);
            return;
        }

        if (!Number.isFinite(time)) {
            console.warn('[Player] Cannot seek: Invalid time provided:', time);
            return;
        }

        const safeTime = Math.max(0, Math.min(time, duration));

        try {
            console.log(`[Player] Seeking to ${safeTime}s / ${duration}s (ReadyState: ${audio.readyState}, Source: ${audio.src.substring(0, 50)}...)`);

            // Set seeking flag to prevent timeupdate from overriding
            isSeekingRef.current = true;

            // If audio is not ready, defer the seek
            if (audio.readyState < 1) {
                console.log('[Player] Audio not ready for seeking, deferring...');
                (audio as any)._targetSeek = safeTime;
            } else {
                audio.currentTime = safeTime;
            }

            // Apply to state immediately for UI responsiveness
            dispatch({ type: 'SET_PROGRESS', payload: safeTime });

            // Reset seeking flag after a short delay to allow browser to update
            setTimeout(() => {
                isSeekingRef.current = false;
            }, 150); // Increased delay for stability

        } catch (err) {
            isSeekingRef.current = false;
            console.error('[Player] Seek failed:', err);
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
