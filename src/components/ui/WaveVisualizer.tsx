/**
 * WaveVisualizer - Animated Audio Waveform
 * Decorative component for creating premium audio visualization effects
 * Used in player background, hero sections, and loading states
 */
import { motion } from 'framer-motion';

interface WaveVisualizerProps {
    /** Number of bars to display */
    bars?: number;
    /** Height of the container in pixels */
    height?: number;
    /** Whether animation is active */
    isPlaying?: boolean;
    /** Visual variant */
    variant?: 'default' | 'mini' | 'hero';
    /** Additional CSS classes */
    className?: string;
}

export function WaveVisualizer({
    bars = 12,
    height = 40,
    isPlaying = true,
    variant = 'default',
    className = ''
}: WaveVisualizerProps) {
    // Generate random heights for bars to create organic look
    const barHeights = Array.from({ length: bars }, () =>
        0.3 + Math.random() * 0.7
    );

    const barWidth = variant === 'mini' ? 2 : variant === 'hero' ? 6 : 4;
    const gap = variant === 'mini' ? 2 : variant === 'hero' ? 4 : 3;

    return (
        <div
            className={`waveform ${className}`}
            style={{ height, gap }}
            aria-hidden="true"
        >
            {barHeights.map((baseHeight, i) => (
                <motion.div
                    key={i}
                    className={`waveform-bar ${isPlaying ? 'animate' : ''}`}
                    style={{
                        width: barWidth,
                        height: `${baseHeight * 100}%`,
                    }}
                    initial={{ scaleY: 0.3, opacity: 0.5 }}
                    animate={isPlaying ? {
                        scaleY: [0.3, baseHeight, 0.5, baseHeight * 0.8, 0.3],
                        opacity: [0.5, 1, 0.7, 0.9, 0.5],
                    } : {
                        scaleY: 0.3,
                        opacity: 0.4
                    }}
                    transition={{
                        duration: 1.5 + Math.random() * 0.5,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                        delay: i * 0.08,
                    }}
                />
            ))}
        </div>
    );
}

/**
 * WaveformProgress - Progress bar styled as audio waveform
 * Premium alternative to standard progress bars
 */
interface WaveformProgressProps {
    progress: number; // 0-100
    className?: string;
}

export function WaveformProgress({ progress, className = '' }: WaveformProgressProps) {
    const bars = 50;

    return (
        <div
            className={`relative flex items-center gap-[2px] h-8 ${className}`}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
        >
            {Array.from({ length: bars }).map((_, i) => {
                const barProgress = (i / bars) * 100;
                const isActive = barProgress <= progress;
                // Create organic wave pattern
                const heightMultiplier = 0.3 + Math.sin(i * 0.5) * 0.3 + Math.random() * 0.4;

                return (
                    <motion.div
                        key={i}
                        className="flex-1 rounded-full"
                        style={{
                            height: `${heightMultiplier * 100}%`,
                            background: isActive
                                ? 'linear-gradient(180deg, var(--accent) 0%, var(--violet) 100%)'
                                : 'rgba(255,255,255,0.1)',
                        }}
                        initial={false}
                        animate={{
                            opacity: isActive ? 1 : 0.4,
                            scale: isActive ? 1 : 0.9,
                        }}
                        transition={{ duration: 0.15 }}
                    />
                );
            })}
        </div>
    );
}
