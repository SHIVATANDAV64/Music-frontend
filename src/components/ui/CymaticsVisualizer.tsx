/**
 * Organic Cymatics Visualizer - True Sound Geometry
 */

import { useEffect, useRef } from 'react';
import { useAudioAnalyzerContext } from '../../context/AudioAnalyzerContext';
import { usePlayer } from '../../context/PlayerContext';
import { Lightbulb, Waves, Sparkles, Dna, Hexagon, Orbit } from 'lucide-react';
import {
    type Particle,
    type VisualizerMode,
    updateParticle,
    getParticleColor
} from './visualizers/particleRenderers';

interface CymaticsVisualizerProps {
    mode?: VisualizerMode;
    className?: string;
}

const PARTICLE_COUNT = 600;
const PARTICLE_SIZE_MULTIPLIER = 1.2;

export function CymaticsVisualizer({
    mode = 'chladni',
    className = ''
}: CymaticsVisualizerProps) {
    const { isPlaying } = usePlayer();
    const { analyzer, isInitialized, getFrequencyData } = useAudioAnalyzerContext();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationFrameRef = useRef<number | null>(null);
    const canvasSizeRef = useRef({ width: 800, height: 100 });

    // Handle canvas resize
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const updateCanvasSize = () => {
            const rect = container.getBoundingClientRect();
            const width = Math.max(300, rect.width);
            const height = Math.max(80, rect.height);

            const devicePixelRatio = window.devicePixelRatio || 1;
            canvas.width = width * devicePixelRatio;
            canvas.height = height * devicePixelRatio;

            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.scale(devicePixelRatio, devicePixelRatio);
            }

            canvasSizeRef.current = { width, height };

            // Only initialize particles if they don't exist yet
            if (particlesRef.current.length === 0) {
                particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: 0,
                    vy: 0,
                    targetX: width / 2,
                    targetY: height / 2,
                    life: Math.random(),
                }));
            } else {
                // Scale existing particles to new canvas size
                const currentWidth = canvasSizeRef.current.width;

                particlesRef.current.forEach(p => {
                    p.targetX = currentWidth / 2;
                    p.targetY = canvasSizeRef.current.height / 2;
                });
            }
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        return () => window.removeEventListener('resize', updateCanvasSize);
    }, []);

    // Animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !analyzer || !isInitialized) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let lastTime = performance.now();

        const animate = (currentTime: number) => {
            const deltaTime = Math.min((currentTime - lastTime) / 16.67, 2);
            lastTime = currentTime;

            // 1. POLL PRE-CALCULATED DATA
            const audioData = getFrequencyData();
            if (!audioData) {
                animationFrameRef.current = requestAnimationFrame(animate);
                return;
            }

            const { volume, bassEnergy, midEnergy, trebleEnergy } = audioData;

            // Optimization: If silent, skip complex drawing
            if (volume === 0 && !isPlaying) {
                ctx.fillStyle = 'rgba(10, 10, 10, 0.2)';
                ctx.fillRect(0, 0, canvasSizeRef.current.width, canvasSizeRef.current.height);
                animationFrameRef.current = requestAnimationFrame(animate);
                return;
            }

            const width = canvasSizeRef.current.width;
            const height = canvasSizeRef.current.height;

            ctx.fillStyle = 'rgba(10, 10, 10, 0.08)';
            ctx.fillRect(0, 0, width, height);

            const particles = particlesRef.current;
            const centerX = width / 2;
            const centerY = height / 2;

            particles.forEach((particle, index) => {
                // Update physics and position via module
                updateParticle({
                    particle,
                    index,
                    totalParticles: particles.length,
                    width,
                    height,
                    centerX,
                    centerY,
                    mode,
                    audioData,
                    time: currentTime,
                    deltaTime
                });

                // Render
                const alpha = particle.life * (0.3 + volume * 0.7);
                const size = PARTICLE_SIZE_MULTIPLIER + volume * 1.5;

                const rgb = getParticleColor(mode, { bass: bassEnergy, mid: midEnergy, treble: trebleEnergy });

                ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
                ctx.fill();
            });

            if (volume > 0.4) {
                const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 150 * volume);
                gradient.addColorStop(0, `rgba(212, 175, 55, ${(volume - 0.4) * 0.15})`);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [mode, analyzer, isInitialized, isPlaying, getFrequencyData]);

    return (
        <div ref={containerRef} className={`relative w-full h-full ${className}`}>
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{
                    imageRendering: 'auto',
                    display: 'block',
                }}
            />

            <div
                className="absolute inset-0 pointer-events-none opacity-5"
                style={{
                    backgroundImage: 'url(data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" /%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noise)" /%3E%3C/svg%3E)',
                    mixBlendMode: 'overlay',
                }}
            />
        </div>
    );
}

interface VisualizerToggleProps {
    mode: VisualizerMode;
    onModeChange: (mode: VisualizerMode) => void;
}

export function VisualizerToggle({ mode, onModeChange }: VisualizerToggleProps) {
    const modes: Array<{ value: VisualizerMode; icon: React.FC<any>; label: string }> = [
        { value: 'chladni', icon: Lightbulb, label: 'Chladni' },
        { value: 'water', icon: Waves, label: 'Water' },
        { value: 'sacred', icon: Sparkles, label: 'Sacred' },
        { value: 'turing', icon: Dna, label: 'Turing' },
        { value: 'voronoi', icon: Hexagon, label: 'Voronoi' },
        { value: 'hopf', icon: Orbit, label: 'Hopf' },
    ];

    return (
        <div className="flex items-center gap-px bg-[var(--color-card)] border border-[var(--color-border)] p-1 backdrop-blur-md">
            {modes.map(({ value, icon: Icon, label }) => (
                <button
                    key={value}
                    onClick={() => onModeChange(value)}
                    className={`
                        relative group flex items-center justify-center gap-2 px-4 py-2 
                        transition-all duration-300 border border-transparent
                        ${mode === value
                            ? 'bg-[var(--color-accent-gold)]/10 border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]'
                            : 'hover:bg-[var(--color-card-hover)] hover:border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                        }
                    `}
                    title={label}
                >
                    {/* Active Corner Markers */}
                    {mode === value && (
                        <>
                            <span className="absolute top-0 left-0 w-1 h-1 bg-[var(--color-accent-gold)]" />
                            <span className="absolute bottom-0 right-0 w-1 h-1 bg-[var(--color-accent-gold)]" />
                        </>
                    )}

                    <Icon size={14} className={mode === value ? 'animate-pulse' : ''} />
                    <span className="hidden sm:block font-mono text-[10px] uppercase tracking-widest leading-none pt-0.5">
                        {label}
                    </span>
                </button>
            ))}
        </div>
    );
}
