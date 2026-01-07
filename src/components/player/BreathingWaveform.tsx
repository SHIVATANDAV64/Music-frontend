/**
 * Breathing Waveform Component
 * 
 * Philosophy: Sound breathes. The waveform should inhale and exhale with the music.
 * This replaces static progress bars with a living, organic representation of audio.
 * 
 * Uses real Web Audio waveform data (time domain) to create an authentic visualization
 * that syncs with the music's natural rhythm.
 */

import { useEffect, useRef } from 'react';
import { useAudioAnalyzerContext } from '../../context/AudioAnalyzerContext';
import { usePlayer } from '../../context/PlayerContext';

interface BreathingWaveformProps {
    /** Height of the waveform in pixels */
    height?: number;
    /** Color of the waveform */
    color?: string;
    /** Whether to show the progress indicator */
    showProgress?: boolean;
    className?: string;
}

export function BreathingWaveform({
    height = 60,
    color = '#c9a962',
    showProgress = true,
    className = '',
}: BreathingWaveformProps) {
    const { isPlaying, progress, duration, seek } = usePlayer();
    const { analyzer, isInitialized } = useAudioAnalyzerContext();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const isHoveringRef = useRef(false);
    const rippleRef = useRef<{ x: number; radius: number; opacity: number } | null>(null);

    // Stable refs for the animation loop to access without dependency changes
    const progressRef = useRef(progress);
    const durationRef = useRef(duration);
    const isPlayingRef = useRef(isPlaying);
    const waveformBufferRef = useRef<Uint8Array | null>(null);

    useEffect(() => { progressRef.current = progress; }, [progress]);
    useEffect(() => { durationRef.current = duration; }, [duration]);
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

    // Handle click to seek
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        const container = containerRef.current;
        const currentDuration = durationRef.current;
        if (!container || !currentDuration || !Number.isFinite(currentDuration)) return;

        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        const newTime = percent * currentDuration;

        seek(newTime);

        // Create ripple effect at click position
        rippleRef.current = {
            x,
            radius: 0,
            opacity: 0.6,
        };
    };

    // Handle hover for magnetic effect
    const handleMouseMove = () => {
        isHoveringRef.current = true;
    };

    const handleMouseLeave = () => {
        isHoveringRef.current = false;
    };

    // Animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !analyzer || !isInitialized) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: false });
        if (!ctx) return;

        // Initialize internal buffer
        if (!waveformBufferRef.current) {
            waveformBufferRef.current = new Uint8Array(analyzer.frequencyBinCount);
        }
        const waveform = waveformBufferRef.current;

        // Set canvas resolution for crisp rendering
        const updateCanvasSize = () => {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const width = Math.max(300, rect.width);
            const devicePixelRatio = window.devicePixelRatio || 1;

            canvas.width = width * devicePixelRatio;
            canvas.height = height * devicePixelRatio;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            ctx.scale(devicePixelRatio, devicePixelRatio);
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);

        let lastTime = performance.now();

        const animate = (currentTime: number) => {
            const deltaTime = Math.max(0, Math.min((currentTime - lastTime) / 16.67, 2));
            lastTime = currentTime;

            // 1. POLL DATA DIRECTLY
            analyzer.getByteTimeDomainData(waveform as unknown as Uint8Array<ArrayBuffer>);

            // Calculate simple volume for "breathing"
            let sum = 0;
            for (let i = 0; i < waveform.length; i++) {
                const v = (waveform[i] / 128.0) - 1.0;
                sum += v * v;
            }
            const volume = Math.sqrt(sum / waveform.length);

            const width = canvas.width / (window.devicePixelRatio || 1);
            const canvasHeight = canvas.height / (window.devicePixelRatio || 1);

            // Clear canvas
            ctx.clearRect(0, 0, width, canvasHeight);

            const currentIsPlaying = isPlayingRef.current;

            if (waveform && waveform.length > 0) {
                // Draw waveform with optimization
                const sliceWidth = width / waveform.length;
                const centerY = canvasHeight / 2;
                const breathScale = 1 + (volume * 1.5); // More breathing in waveform

                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.5;

                // Draw waveform - use every other point for large arrays
                const step = waveform.length > 512 ? 2 : 1;
                for (let i = 0; i < waveform.length; i += step) {
                    const v = waveform[i] / 128.0;
                    const y = ((v - 1) * centerY * breathScale) + centerY;
                    const x = i * sliceWidth;

                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }

                ctx.stroke();

                // Add subtle glow when playing loud
                if (currentIsPlaying && volume > 0.1) {
                    ctx.shadowBlur = 4 + (volume * 10);
                    ctx.shadowColor = color;
                    ctx.globalAlpha = 0.3;
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                    ctx.shadowBlur = 0;
                }
            } else {
                // Fallback: Draw subtle line
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.15;
                ctx.beginPath();
                ctx.moveTo(0, canvasHeight / 2);
                ctx.lineTo(width, canvasHeight / 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // Draw progress indicator
            const currentDuration = durationRef.current;
            const currentProgress = progressRef.current;

            if (showProgress && currentDuration > 0) {
                const progressX = (currentProgress / currentDuration) * width;

                // Progress line (lighter)
                ctx.strokeStyle = color;
                ctx.lineWidth = 0.5;
                ctx.globalAlpha = 0.2;
                ctx.beginPath();
                ctx.moveTo(progressX, 0);
                ctx.lineTo(progressX, canvasHeight);
                ctx.stroke();
                ctx.globalAlpha = 1;

                // Playhead dot
                const dotSize = isHoveringRef.current ? 5 : 3;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(progressX, canvasHeight / 2, dotSize, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw ripple effect on click
            if (rippleRef.current) {
                const ripple = rippleRef.current;
                ripple.radius += 2 * deltaTime;
                ripple.opacity -= 0.018 * deltaTime;

                if (ripple.opacity > 0) {
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1.5;
                    ctx.globalAlpha = ripple.opacity * 0.5;
                    ctx.beginPath();
                    ctx.arc(ripple.x, canvasHeight / 2, Math.max(0, ripple.radius), 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                } else {
                    rippleRef.current = null;
                }
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            window.removeEventListener('resize', updateCanvasSize);
        };
    }, [color, showProgress, analyzer, isInitialized, height]);

    return (
        <div
            ref={containerRef}
            className={`relative w-full cursor-pointer group ${className}`}
            style={{ height: `${height}px` }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                }}
            />
            {/* Hover indicator */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/2 transition-colors pointer-events-none rounded-sm" />
        </div>
    );
}
