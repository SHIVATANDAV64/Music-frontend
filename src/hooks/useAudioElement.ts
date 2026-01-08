import { useState, useRef, useEffect } from 'react';
import { storage, BUCKETS, getProxiedAudioUrlSync, fetchProxiedAudioBlob, isAudioProxied, fetchStorageAudioBlob } from '../lib/appwrite';
import { historyService } from '../services';
import type { PlayableItem, Track } from '../types';

interface UseAudioElementProps {
    currentTrack: PlayableItem | null;
    volume: number;
    repeatMode: 'none' | 'one' | 'all';
    shuffle: boolean;
    onProgress: (time: number) => void;
    onDuration: (duration: number) => void;
    onEnded: () => void;
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
}

export function useAudioElement({
    currentTrack,
    volume,
    repeatMode,
    shuffle: _shuffle,
    onProgress,
    onDuration,
    onEnded,
    onPlay,
    onPause,
    onNext
}: UseAudioElementProps) {
    // Audio element state
    const [audio, setAudio] = useState<HTMLAudioElement>(() => {
        const a = new Audio();
        a.volume = volume;
        a.preload = 'auto';
        return a;
    });

    // Refs
    const audioRef = useRef<HTMLAudioElement | null>(audio);
    const repeatRef = useRef(repeatMode);
    const isSeekingRef = useRef(false);
    const playbackRequestId = useRef(0);
    const playPromiseRef = useRef<Promise<void> | null>(null);

    // Refs for values used in track change effect (preventing stale closures)
    const volumeRef = useRef(volume);
    const onPlayRef = useRef(onPlay);
    const onNextRef = useRef(onNext);

    // Sync refs
    useEffect(() => {
        audioRef.current = audio;
    }, [audio]);

    useEffect(() => {
        repeatRef.current = repeatMode;
    }, [repeatMode]);

    useEffect(() => {
        volumeRef.current = volume;
    }, [volume]);

    useEffect(() => {
        onPlayRef.current = onPlay;
        onNextRef.current = onNext;
    }, [onPlay, onNext]);

    // Handle Volume Changes
    useEffect(() => {
        if (audio) {
            audio.volume = volume;
        }
    }, [volume, audio]);

    // Attach Listeners
    useEffect(() => {
        const handleTimeUpdate = () => {
            if (!isSeekingRef.current) {
                onProgress(audio.currentTime);
            }
        };

        const handleLoadedMetadata = () => {
            onDuration(audio.duration);
        };

        const handleEnded = () => {
            // Local repeat one logic
            if (repeatRef.current === 'one') {
                audio.currentTime = 0;
                audio.play().catch(() => { });
            } else {
                onNext();
            }
            onEnded();
        };

        const handleCanPlay = () => {
            const targetSeek = (audio as any)._targetSeek;
            if (targetSeek !== undefined) {
                audio.currentTime = targetSeek;
                delete (audio as any)._targetSeek;
            }
        };

        const handlePlayEvent = () => onPlay();
        const handlePauseEvent = () => onPause();

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('play', handlePlayEvent);
        audio.addEventListener('pause', handlePauseEvent);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('play', handlePlayEvent);
            audio.removeEventListener('pause', handlePauseEvent);
        };
    }, [audio, onProgress, onDuration, onEnded, onNext, onPlay, onPause]);

    // Handle Track Changes & Playback
    useEffect(() => {
        if (currentTrack) {
            const currentRequestId = ++playbackRequestId.current;

            const startPlayback = async () => {
                // 1. Determine safe Audio URL
                let audioUrl = '';
                let isExternalSource = false;
                let originalExternalUrl: string | null = null;

                try {
                    if ('audio_url' in currentTrack && currentTrack.audio_url) {
                        originalExternalUrl = currentTrack.audio_url;
                        audioUrl = getProxiedAudioUrlSync(originalExternalUrl);
                        isExternalSource = true;
                    } else if ('audio_file_id' in currentTrack && currentTrack.audio_file_id) {
                        audioUrl = storage.getFileView(BUCKETS.AUDIO, currentTrack.audio_file_id).toString();
                        isExternalSource = false;
                    } else {
                        throw new Error('No audio source found');
                    }

                    // 2. Handle AudioContext "Capture" (Silence Fix)
                    let currentAudio = audio;
                    const isElementCaptured = (currentAudio as any)._isCaptured;

                    // If captured and switching to external (non-proxied usually), we need a fresh element
                    if (isElementCaptured && isExternalSource && !audioUrl.startsWith('blob:')) {
                        currentAudio.pause();
                        currentAudio.src = '';

                        const newAudio = new Audio();
                        newAudio.volume = volumeRef.current;
                        newAudio.preload = 'auto';
                        setAudio(newAudio);
                        currentAudio = newAudio;
                    } else {
                        currentAudio.pause();
                    }

                    // Cancel previous play promise
                    if (playPromiseRef.current) {
                        playPromiseRef.current.catch(() => { });
                    }

                    if (playbackRequestId.current !== currentRequestId) return;

                    currentAudio.currentTime = 0;

                    // CORS Configuration
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
                        onPlayRef.current();

                        // History
                        const isEpisode = 'episode_id' in currentTrack;
                        const trackSource = 'audio_url' in currentTrack ? 'jamendo' : 'appwrite';
                        historyService.recordPlay(currentTrack.$id, isEpisode, trackSource, currentTrack as Track);
                    }

                    // 4. Background Proxy Upgrade (Blob)
                    if (playbackRequestId.current === currentRequestId) {
                        try {
                            let blobUrl = '';
                            if (isExternalSource && !isAudioProxied(originalExternalUrl!)) {
                                blobUrl = await fetchProxiedAudioBlob(originalExternalUrl!);
                            } else if (!isExternalSource && !audioUrl.startsWith('blob:')) {
                                const fileId = (currentTrack as Track).audio_file_id!;
                                blobUrl = await fetchStorageAudioBlob(fileId);
                            }

                            if (blobUrl && playbackRequestId.current === currentRequestId && currentAudio.src !== blobUrl) {
                                const currentTime = currentAudio.currentTime;
                                const wasPlaying = !currentAudio.paused;

                                currentAudio.crossOrigin = 'anonymous';
                                currentAudio.src = blobUrl;
                                (currentAudio as any)._targetSeek = currentTime;

                                if (wasPlaying) {
                                    const resumePromise = currentAudio.play();
                                    playPromiseRef.current = resumePromise;
                                    await resumePromise.catch((e) => {
                                        if (e.name !== 'AbortError') console.warn('Resume failed:', e);
                                    });
                                }
                            }
                        } catch (err) {
                            console.warn('[Player] Blob upgrade failed:', err);
                        }
                    }

                } catch (err: any) {
                    if (playbackRequestId.current === currentRequestId) {
                        if (err.name === 'AbortError') {
                            // Expected
                        } else {
                            console.error('[Player] Playback failed:', err);

                            // Auto-skip logic could go here or be handled by the parent
                            // For complex recovery, we might trigger onNext() after a timeout
                            setTimeout(() => {
                                onNextRef.current();
                            }, 1500);
                        }
                    }
                }
            };

            startPlayback();
        }
    }, [currentTrack?.$id]); // Dependency on ID to detect track change

    // Exposed methods
    const seek = (time: number) => {
        if (!audio) return;

        const duration = audio.duration;
        if (!Number.isFinite(duration) || duration === 0) return;

        const safeTime = Math.max(0, Math.min(time, duration));
        isSeekingRef.current = true;

        if (audio.readyState < 1) {
            (audio as any)._targetSeek = safeTime;
        } else {
            audio.currentTime = safeTime;
        }

        // Notify parent immediately for UI
        onProgress(safeTime);

        setTimeout(() => {
            isSeekingRef.current = false;
        }, 150);
    };

    return {
        audio,
        audioRef,
        seek
    };
}
