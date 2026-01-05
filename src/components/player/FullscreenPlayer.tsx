/**
 * Fullscreen Player Component
 * Immersive player with lyrics, visualizer, and dynamic color background.
 * Based on soulmate-mono's FullscreenPlayer.tsx
 */

import { useState, useEffect, useRef } from 'react';
import { X, Music } from 'lucide-react';
import { extractDominantColor, createGradientFromColor } from '../../utils/colorExtractor';
import { getLyrics, type LyricsResult } from '../../services/lyrics.service';

interface FullscreenPlayerProps {
    trackName: string | null;
    artistName: string | null;
    albumArt: string | null;
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    isVisible: boolean;
    onClose: () => void;
}

export function FullscreenPlayer({
    trackName,
    artistName,
    albumArt,
    currentTime,
    isPlaying,
    isVisible,
    onClose,
}: FullscreenPlayerProps) {
    const [lyrics, setLyrics] = useState<LyricsResult | null>(null);
    const [activeLineIndex, setActiveLineIndex] = useState(-1);
    const [backgroundGradient, setBackgroundGradient] = useState('linear-gradient(180deg, rgba(20, 20, 20, 1) 0%, rgba(10, 10, 10, 1) 100%)');
    const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);

    const lyricsContainerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);

    // Extract dominant color from album art
    useEffect(() => {
        if (!albumArt || !isVisible) return;

        extractDominantColor(albumArt).then((color) => {
            setBackgroundGradient(createGradientFromColor(color));
        });
    }, [albumArt, isVisible]);

    // Fetch lyrics
    useEffect(() => {
        if (!trackName || !artistName || !isVisible) {
            setLyrics(null);
            return;
        }

        const fetchLyrics = async () => {
            setIsLoadingLyrics(true);
            try {
                const result = await getLyrics(trackName, artistName);
                setLyrics(result);
            } catch (err) {
                console.error('Failed to fetch lyrics:', err);
            } finally {
                setIsLoadingLyrics(false);
            }
        };

        fetchLyrics();
    }, [trackName, artistName, isVisible]);

    // Update active lyric line
    useEffect(() => {
        if (!lyrics?.syncedLyrics) return;

        const lines = lyrics.syncedLyrics;
        let newActiveIndex = -1;

        for (let i = lines.length - 1; i >= 0; i--) {
            if (currentTime >= lines[i].time) {
                newActiveIndex = i;
                break;
            }
        }

        if (newActiveIndex !== activeLineIndex) {
            setActiveLineIndex(newActiveIndex);
        }
    }, [currentTime, lyrics, activeLineIndex]);

    // Auto-scroll lyrics
    useEffect(() => {
        if (lyricsContainerRef.current && activeLineIndex !== -1) {
            const container = lyricsContainerRef.current;
            const activeElement = container.children[activeLineIndex] as HTMLElement;
            if (activeElement) {
                activeElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }
        }
    }, [activeLineIndex]);

    // Wave visualizer animation
    useEffect(() => {
        if (!isVisible || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const barCount = 32;
        const barHeights = new Array(barCount).fill(0);
        const targetHeights = new Array(barCount).fill(0);
        let phase = 0;
        let lastTime = performance.now();

        const draw = (currentAnimTime: number) => {
            if (!isVisible) return;

            const deltaTime = (currentAnimTime - lastTime) / 16.67;
            lastTime = currentAnimTime;

            animationRef.current = requestAnimationFrame(draw);

            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);

            const barWidth = width / barCount;
            const gap = 3;

            phase += (isPlaying ? 0.12 : 0.03) * deltaTime;

            for (let i = 0; i < barCount; i++) {
                const freq1 = Math.sin(phase + i * 0.25);
                const freq2 = Math.sin(phase * 1.7 + i * 0.18);
                const freq3 = Math.sin(phase * 0.6 + i * 0.4);

                const centerWeight = 1 - Math.abs((i - barCount / 2) / (barCount / 2)) * 0.3;
                const waveValue = (freq1 * 0.35 + freq2 * 0.25 + freq3 * 0.25) * 0.5 + 0.5;

                if (isPlaying) {
                    targetHeights[i] = waveValue * height * 0.85 * centerWeight;
                } else {
                    targetHeights[i] = 4 + Math.sin(phase * 0.5 + i * 0.2) * 2;
                }

                const smoothing = isPlaying ? 0.18 : 0.08;
                barHeights[i] += (targetHeights[i] - barHeights[i]) * smoothing * deltaTime;

                const barHeight = Math.max(4, barHeights[i]);
                const x = i * barWidth + gap / 2;
                const y = height - barHeight;

                const brightness = isPlaying ? 0.5 + (barHeight / height) * 0.5 : 0.25;

                ctx.fillStyle = `rgba(201, 169, 98, ${brightness})`; // Gold color
                ctx.beginPath();
                ctx.roundRect(x, y, barWidth - gap, barHeight, [3, 3, 0, 0]);
                ctx.fill();
            }
        };

        animationRef.current = requestAnimationFrame(draw);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isVisible, isPlaying]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isVisible) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: backgroundGradient,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '48px',
                overflow: 'hidden',
            }}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: 24,
                    right: 24,
                    padding: 12,
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(12px)',
                    color: 'white',
                    transition: 'all 0.2s ease',
                }}
            >
                <X size={24} />
            </button>

            {/* Content */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 32,
                width: '100%',
                maxWidth: 600,
                height: '100%',
            }}>
                {/* Album Art */}
                <div style={{
                    width: 280,
                    height: 280,
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
                    flexShrink: 0,
                }}>
                    {albumArt ? (
                        <img
                            src={albumArt}
                            alt={trackName || 'Album art'}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                    ) : (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255, 255, 255, 0.05)',
                        }}>
                            <Music size={64} color="rgba(255, 255, 255, 0.2)" />
                        </div>
                    )}
                </div>

                {/* Track Info */}
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: 'white',
                        margin: 0,
                        marginBottom: 8,
                    }}>
                        {trackName || 'No track selected'}
                    </h2>
                    <p style={{
                        fontSize: 18,
                        color: 'rgba(255, 255, 255, 0.7)',
                        margin: 0,
                    }}>
                        {artistName || 'Unknown artist'}
                    </p>
                </div>

                {/* Visualizer */}
                <canvas
                    ref={canvasRef}
                    width={400}
                    height={60}
                    style={{
                        width: '100%',
                        maxWidth: 400,
                        height: 60,
                        flexShrink: 0,
                    }}
                />

                {/* Lyrics */}
                <div
                    ref={lyricsContainerRef}
                    style={{
                        flex: 1,
                        overflow: 'auto',
                        width: '100%',
                        textAlign: 'center',
                        paddingBottom: 100,
                    }}
                >
                    {isLoadingLyrics && (
                        <div style={{ color: 'rgba(255, 255, 255, 0.5)', padding: 24 }}>
                            Loading lyrics...
                        </div>
                    )}

                    {lyrics?.syncedLyrics?.map((line, index) => (
                        <div
                            key={index}
                            style={{
                                fontSize: index === activeLineIndex ? 24 : 18,
                                fontWeight: index === activeLineIndex ? 700 : 400,
                                color: index === activeLineIndex
                                    ? 'white'
                                    : index < activeLineIndex
                                        ? 'rgba(255, 255, 255, 0.3)'
                                        : 'rgba(255, 255, 255, 0.6)',
                                padding: '8px 0',
                                transition: 'all 0.3s ease',
                                transform: index === activeLineIndex ? 'scale(1.05)' : 'scale(1)',
                            }}
                        >
                            {line.text}
                        </div>
                    ))}

                    {lyrics && !lyrics.syncedLyrics && lyrics.plainLyrics && (
                        <div style={{
                            whiteSpace: 'pre-wrap',
                            fontSize: 16,
                            color: 'rgba(255, 255, 255, 0.7)',
                            lineHeight: 2,
                        }}>
                            {lyrics.plainLyrics}
                        </div>
                    )}

                    {!lyrics && !isLoadingLyrics && (
                        <div style={{ color: 'rgba(255, 255, 255, 0.4)', padding: 24 }}>
                            No lyrics available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FullscreenPlayer;
