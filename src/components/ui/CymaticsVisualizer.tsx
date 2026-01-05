/**
 * Organic Cymatics Visualizer - True Sound Geometry
 */

import { useEffect, useRef } from 'react';
import { useAudioFrequency } from '../../context/AudioAnalyzerContext';
import { usePlayer } from '../../context/PlayerContext';
import { particlePhysics } from '../../lib/motion';
import { Lightbulb, Waves, Sparkles } from 'lucide-react';

type VisualizerMode = 'chladni' | 'water' | 'sacred';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    targetX: number;
    targetY: number;
    life: number;
}

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
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationFrameRef = useRef<number | null>(null);
    const canvasSizeRef = useRef({ width: 800, height: 100 });

    const frequencyData = useAudioFrequency();

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

            particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: 0,
                vy: 0,
                targetX: width / 2,
                targetY: height / 2,
                life: Math.random(),
            }));
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        return () => window.removeEventListener('resize', updateCanvasSize);
    }, []);

    // Animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let lastTime = performance.now();
        let frameCount = 0;

        const animate = (currentTime: number) => {
            frameCount++;
            const deltaTime = Math.min((currentTime - lastTime) / 16.67, 2);
            lastTime = currentTime;

            if (frameCount % 2 === 0 && frequencyData?.volume === 0) {
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

            const bassEnergy = frequencyData?.bassEnergy ?? 0;
            const midEnergy = frequencyData?.midEnergy ?? 0;
            const trebleEnergy = frequencyData?.trebleEnergy ?? 0;
            const volume = frequencyData?.volume ?? 0;

            particles.forEach((particle, index) => {
                if (particle.life < 1) {
                    particle.life = Math.min(1, particle.life + 0.02 * deltaTime);
                }

                let targetX = centerX;
                let targetY = centerY;

                if (mode === 'chladni') {
                    const angle = (index / particles.length) * Math.PI * 2;
                    const radius = (bassEnergy * (width * 0.2)) + (midEnergy * (width * 0.1));
                    const harmonicOffset = Math.sin(angle * 4) * trebleEnergy * (width * 0.1);

                    targetX = centerX + Math.cos(angle) * (radius + harmonicOffset);
                    targetY = centerY + Math.sin(angle) * (radius + harmonicOffset) * 0.6;

                } else if (mode === 'water') {
                    const angle = (index / particles.length) * Math.PI * 2;
                    const ring = Math.floor(index / (particles.length / 5));
                    const baseRadius = ring * (width * 0.08);
                    const pulse = Math.sin(currentTime * 0.003 + ring) * bassEnergy * (width * 0.05);
                    const rippleRadius = baseRadius + pulse;

                    targetX = centerX + Math.cos(angle) * rippleRadius;
                    targetY = centerY + Math.sin(angle) * rippleRadius;

                } else if (mode === 'sacred') {
                    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
                    const angle = index * goldenAngle;
                    const radius = Math.sqrt(index) * (5 + midEnergy * (width * 0.02));
                    const spiralTightness = 1 + trebleEnergy * 2;

                    targetX = centerX + Math.cos(angle * spiralTightness) * radius;
                    targetY = centerY + Math.sin(angle * spiralTightness) * radius;
                }

                particle.targetX = targetX;
                particle.targetY = targetY;

                const dx = targetX - particle.x;
                const dy = targetY - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 0.1) {
                    const force = distance * particlePhysics.stiffness;
                    particle.vx += (dx / distance) * force;
                    particle.vy += (dy / distance) * force;
                }

                particle.vx *= particlePhysics.damping;
                particle.vy *= particlePhysics.damping;

                const speed = Math.sqrt(particle.vx ** 2 + particle.vy ** 2);
                if (speed > particlePhysics.maxVelocity) {
                    particle.vx = (particle.vx / speed) * particlePhysics.maxVelocity;
                    particle.vy = (particle.vy / speed) * particlePhysics.maxVelocity;
                }

                particle.x += particle.vx * deltaTime;
                particle.y += particle.vy * deltaTime;

                const alpha = particle.life * (0.3 + volume * 0.7);
                const size = PARTICLE_SIZE_MULTIPLIER + volume * 1.5;

                // Organic Ink / Gold / Sand Palette
                // R: 212, G: 175, B: 55 (Gold)
                // R: 42, G: 59, B: 85 (Deep Ink Blue)
                // R: 200, G: 200, B: 190 (Sand/Paper)

                let r, g, b;

                if (mode === 'chladni') {
                    // Gold Sand
                    r = 212; g = 175; b = 55;
                } else if (mode === 'water') {
                    // Deep Ink
                    r = 100 + (trebleEnergy * 100);
                    g = 149 + (midEnergy * 50);
                    b = 237;
                } else {
                    // Sacred Geometry - White/Paper
                    r = 230; g = 230; b = 230;
                }

                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
                ctx.fill();
            });

            if (volume > 0.4) {
                // Subtle central glow, not overwhelming
                const gradient = ctx.createRadialGradient(
                    centerX, centerY, 0,
                    centerX, centerY, 150 * volume
                );
                // Gold bloom
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
    }, [mode, frequencyData, isPlaying]);

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
    const modes: Array<{ value: VisualizerMode; icon: React.ComponentType<{ size: number }>; label: string }> = [
        { value: 'chladni', icon: Lightbulb, label: 'Chladni' },
        { value: 'water', icon: Waves, label: 'Water' },
        { value: 'sacred', icon: Sparkles, label: 'Sacred' },
    ];

    return (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
            {modes.map(({ value, icon: Icon, label }) => (
                <button
                    key={value}
                    onClick={() => onModeChange(value)}
                    className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all ${mode === value
                        ? 'bg-[#c9a962] text-[#0a0a0a]'
                        : 'text-[#fafaf5]/60 hover:text-[#fafaf5] hover:bg-white/5'
                        }`}
                    title={label}
                >
                    <Icon size={13} />
                    <span className="text-xs font-medium">{label}</span>
                </button>
            ))}

            <div className="sm:hidden flex items-center gap-1">
                {modes.map(({ value, icon: Icon, label }) => (
                    <button
                        key={value}
                        onClick={() => onModeChange(value)}
                        className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${mode === value
                            ? 'bg-[#c9a962] text-[#0a0a0a]'
                            : 'text-[#fafaf5]/60 hover:text-[#fafaf5] hover:bg-white/5'
                            }`}
                        title={label}
                    >
                        <Icon size={13} />
                    </button>
                ))}
            </div>
        </div>
    );
}
