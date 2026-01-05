/**
 * OrganicVisualizer - Sound Made Visible
 * 
 * Philosophy: Sound organizes matter into beauty (cymatics).
 * This visualizer gives form to the formless through gentle,
 * nature-inspired movement.
 * 
 * Three modes as per user request:
 * 1. ambient - Subtle campfire glow (background)
 * 2. wave - Gentle waves, always present
 * 3. hero - Prominent, full experience
 */
import { motion, useSpring, useTransform } from 'framer-motion';
import { usePlayer } from '../../context/PlayerContext';
import { useState, useEffect, useMemo } from 'react';

type VisualizerMode = 'ambient' | 'wave' | 'hero';

interface OrganicVisualizerProps {
    mode?: VisualizerMode;
    className?: string;
}

/**
 * Cymatics-inspired visualizer that responds to music
 * Like ripples on water when a stone drops
 */
export function OrganicVisualizer({
    mode = 'ambient',
    className = ''
}: OrganicVisualizerProps) {
    const { isPlaying, audioRef } = usePlayer();
    const [audioData, setAudioData] = useState<number[]>([]);

    // Fibonacci-based element counts for natural distribution
    const elementCounts = useMemo(() => ({
        ambient: 8,   // Subtle background
        wave: 13,     // Medium presence
        hero: 21,     // Full experience
    }), []);

    const elementCount = elementCounts[mode];

    // Simple audio analysis for organic response
    useEffect(() => {
        if (!isPlaying || !audioRef.current) {
            // When not playing, gentle idle breathing
            const idleData = Array(elementCount).fill(0).map(() =>
                0.2 + Math.random() * 0.1
            );
            setAudioData(idleData);
            return;
        }

        // Simulate audio response (in a real app, use Web Audio API)
        const interval = setInterval(() => {
            const newData = Array(elementCount).fill(0).map((_, i) => {
                // Organic variation with Fibonacci-inspired timing
                const phase = (Date.now() / 1000) + (i * 0.618); // Golden ratio phase offset
                const base = 0.3 + Math.sin(phase * 2) * 0.3;
                const variation = Math.random() * 0.2;
                return Math.min(1, base + variation);
            });
            setAudioData(newData);
        }, 100);

        return () => clearInterval(interval);
    }, [isPlaying, elementCount, audioRef]);

    // Mode-specific styles
    const modeStyles = useMemo(() => ({
        ambient: {
            container: 'opacity-30 blur-sm',
            element: 'w-2 h-2',
        },
        wave: {
            container: 'opacity-60',
            element: 'w-3 h-8',
        },
        hero: {
            container: 'opacity-100',
            element: 'w-4 h-16',
        },
    }), []);

    const styles = modeStyles[mode];

    return (
        <div
            className={`flex items-end justify-center gap-[var(--space-3)] ${styles.container} ${className}`}
            role="img"
            aria-label="Music visualization"
        >
            {audioData.map((value, index) => (
                <VisualizerElement
                    key={index}
                    value={value}
                    index={index}
                    baseClass={styles.element}
                />
            ))}
        </div>
    );
}

/**
 * Single visualizer element - like a blade of grass swaying
 */
function VisualizerElement({
    value,
    index,
    baseClass,
}: {
    value: number;
    index: number;
    baseClass: string;
}) {
    // Smooth spring animation for organic feel
    const springValue = useSpring(value, {
        damping: 20,
        stiffness: 100,
    });

    const scaleY = useTransform(springValue, [0, 1], [0.2, 1]);
    const opacity = useTransform(springValue, [0, 1], [0.4, 1]);

    // Stagger delay based on Fibonacci position
    const delay = (index * 50) % 500;

    return (
        <motion.div
            className={`${baseClass} rounded-full bg-gradient-to-t from-[var(--accent)] to-[var(--accent-light)]`}
            style={{
                scaleY,
                opacity,
                transformOrigin: 'bottom',
            }}
            initial={{ scaleY: 0.2 }}
            animate={{ scaleY: value }}
            transition={{
                duration: 0.3,
                ease: [0.16, 1, 0.3, 1], // --ease-organic
                delay: delay / 1000,
            }}
        />
    );
}

/**
 * Ambient glow effect - campfire warmth
 * Creates a gentle pulsing background
 */
export function AmbientGlow({
    isActive = false,
    intensity = 0.3,
}: {
    isActive?: boolean;
    intensity?: number;
}) {
    return (
        <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{
                opacity: isActive ? intensity : 0,
                scale: isActive ? [1, 1.05, 1] : 1,
            }}
            transition={{
                opacity: { duration: 0.6 },
                scale: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                },
            }}
            style={{
                background: 'radial-gradient(ellipse at center, var(--accent-muted) 0%, transparent 60%)',
                filter: 'blur(40px)',
            }}
        />
    );
}

/**
 * Visualizer mode toggle control
 */
export function VisualizerModeToggle({
    mode,
    onModeChange,
}: {
    mode: VisualizerMode;
    onModeChange: (mode: VisualizerMode) => void;
}) {
    const modes: VisualizerMode[] = ['ambient', 'wave', 'hero'];
    const labels = {
        ambient: 'Glow',
        wave: 'Wave',
        hero: 'Full',
    };

    return (
        <div className="flex items-center gap-[var(--space-3)] p-[var(--space-5)] bg-[var(--bg-card)] rounded-full">
            {modes.map((m) => (
                <button
                    key={m}
                    onClick={() => onModeChange(m)}
                    className={`
                        px-[var(--space-13)] py-[var(--space-5)] rounded-full text-sm transition-all
                        ${mode === m
                            ? 'bg-[var(--accent)] text-[var(--bg-deep)]'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }
                    `}
                >
                    {labels[m]}
                </button>
            ))}
        </div>
    );
}
