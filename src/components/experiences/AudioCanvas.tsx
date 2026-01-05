/**
 * Audio Canvas - Immersive Full-Screen Music Experience
 * 
 * Philosophy: The player shouldn't be a bar at the bottom. It should be a WORLD you enter.
 * This creates a sanctuary for deep listening, where the music becomes an environment.
 * 
 * Interaction Model (Natural Gestures):
 * - Click anywhere → Play/Pause (like touching calm water)
 * - Drag up/down → Volume (natural gesture)
 * - Swipe left/right → Next/Previous track
 * - Touch and hold → Reveal controls + queue
 * - ESC key → Exit canvas
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayer } from '../../context/PlayerContext';
import { CymaticsVisualizer } from '../ui/CymaticsVisualizer';
import { getTrackCoverUrl } from '../../utils/trackUtils';
import { Play, Pause, SkipBack, SkipForward, X, Volume2 } from 'lucide-react';
import { naturalSpring, liquidTransition } from '../../lib/motion';
import type { Track } from '../../types';

interface AudioCanvasProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AudioCanvas({ isOpen, onClose }: AudioCanvasProps) {
    const {
        currentTrack,
        isPlaying,
        volume,
        pause,
        resume,
        next,
        previous,
    } = usePlayer();

    const [showControls, setShowControls] = useState(true);
    const [albumArt, setAlbumArt] = useState<string | null>(null);
    const [dominantColor, setDominantColor] = useState('#0a0a0a');
    const controlsTimeoutRef = useRef<number | null>(null);


    // Get album art and dominant color
    useEffect(() => {
        if (!currentTrack) return;

        // Source-aware cover URL
        if ('source' in currentTrack) {
            const url = getTrackCoverUrl(currentTrack as Track, 800, 800);
            if (url) {
                setAlbumArt(url);
                // Extract dominant color from album art
                extractDominantColor(url).then(setDominantColor);
            }
        }
    }, [currentTrack]);

    // Auto-hide controls after 3 seconds
    useEffect(() => {
        if (!isOpen) return;

        const resetTimer = () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }

            setShowControls(true);

            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        };

        resetTimer();

        return () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, [isOpen, isPlaying]);

    // Show controls on mouse move
    const handleMouseMove = () => {
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }

        setShowControls(true);

        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 3000);
    };

    // ESC to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // Play/pause on click
    const handleCanvasClick = () => {
        if (isPlaying) {
            pause();
        } else {
            resume();
        }
    };

    // Volume drag handler (for future gesture controls)
    // const handleVolumeDragEnd = () => {
    //   const newVolume = Math.max(0, Math.min(1, volumeProgress.get()));
    //   setVolume(newVolume);
    //   dragY.set(0);
    // };  };

    if (!currentTrack) return null;

    const trackName: string = 'title' in currentTrack ? currentTrack.title : '';
    const artistName: string = 'artist' in currentTrack ? currentTrack.artist : ('podcaster_name' in currentTrack ? (currentTrack.podcaster_name as string) : '');

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[9999] overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={liquidTransition}
                    onMouseMove={handleMouseMove}
                >
                    {/* Atmospheric Background - Album Art Blurred */}
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: albumArt ? `url(${albumArt})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: 'blur(60px) brightness(0.3)',
                        }}
                    />

                    {/* Color Atmosphere Overlay */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background: `radial-gradient(ellipse at center, ${dominantColor}40 0%, #0a0a0a 70%)`,
                        }}
                    />

                    {/* Cymatics Visualizer - The Centerpiece */}
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        onClick={handleCanvasClick}
                        style={{ cursor: 'pointer', pointerEvents: 'all' }}
                    >
                        <div className="w-[min(90vh,90vw)] h-[min(90vh,90vw)] opacity-60">
                            <CymaticsVisualizer mode="sacred" />
                        </div>
                    </div>

                    {/* Track Info - Floating */}
                    <AnimatePresence>
                        {showControls && (
                            <motion.div
                                className="absolute top-20 left-0 right-0 text-center px-8 pointer-events-none"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={naturalSpring}
                            >
                                <h1 className="text-5xl font-light text-[#fafaf5] mb-3 tracking-tight">
                                    {trackName}
                                </h1>
                                <p className="text-xl text-[#fafaf5]/60 font-light">
                                    {artistName}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Bottom Controls - Fade In/Out */}
                    <AnimatePresence>
                        {showControls && (
                            <motion.div
                                className="absolute bottom-0 left-0 right-0 p-12"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={naturalSpring}
                            >
                                <div className="max-w-2xl mx-auto">
                                    {/* Playback Controls */}
                                    <div className="flex items-center justify-center gap-8 mb-8">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                previous();
                                            }}
                                            className="w-12 h-12 rounded-full backdrop-blur-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
                                        >
                                            <SkipBack size={20} className="text-[#fafaf5]" />
                                        </button>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCanvasClick();
                                            }}
                                            className="w-16 h-16 rounded-full backdrop-blur-xl bg-[#c9a962] flex items-center justify-center hover:bg-[#d4b76e] transition-colors shadow-lg"
                                        >
                                            {isPlaying ? (
                                                <Pause size={28} className="text-[#0a0a0a]" fill="currentColor" />
                                            ) : (
                                                <Play size={28} className="text-[#0a0a0a] ml-1" fill="currentColor" />
                                            )}
                                        </button>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                next();
                                            }}
                                            className="w-12 h-12 rounded-full backdrop-blur-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
                                        >
                                            <SkipForward size={20} className="text-[#fafaf5]" />
                                        </button>
                                    </div>

                                    {/* Volume Indicator */}
                                    <div className="flex items-center justify-center gap-3">
                                        <Volume2 size={16} className="text-[#fafaf5]/60" />
                                        <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-[#c9a962]"
                                                style={{ width: `${volume * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-[#fafaf5]/60 w-12 text-right">
                                            {Math.round(volume * 100)}%
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Close Button - Always Visible */}
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 w-10 h-10 rounded-full backdrop-blur-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors z-50"
                    >
                        <X size={20} className="text-[#fafaf5]" />
                    </button>

                    {/* Grain Texture Overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-5"
                        style={{
                            backgroundImage:
                                'url(data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" /%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noise)" /%3E%3C/svg%3E)',
                            mixBlendMode: 'overlay',
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/**
 * Extract dominant color from image URL
 * Uses canvas color sampling
 */
async function extractDominantColor(imageUrl: string): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve('#0a0a0a');
                return;
            }

            canvas.width = 100;
            canvas.height = 100;
            ctx.drawImage(img, 0, 0, 100, 100);

            const imageData = ctx.getImageData(0, 0, 100, 100).data;
            let r = 0,
                g = 0,
                b = 0;

            for (let i = 0; i < imageData.length; i += 4) {
                r += imageData[i];
                g += imageData[i + 1];
                b += imageData[i + 2];
            }

            const pixelCount = imageData.length / 4;
            r = Math.floor(r / pixelCount);
            g = Math.floor(g / pixelCount);
            b = Math.floor(b / pixelCount);

            // Desaturate slightly for atmosphere
            const gray = (r + g + b) / 3;
            r = Math.floor(r * 0.7 + gray * 0.3);
            g = Math.floor(g * 0.7 + gray * 0.3);
            b = Math.floor(b * 0.7 + gray * 0.3);

            resolve(`rgb(${r}, ${g}, ${b})`);
        };

        img.onerror = () => resolve('#0a0a0a');
        img.src = imageUrl;
    });
}
