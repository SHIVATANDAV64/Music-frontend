/**
 * Organic Cymatics Visualizer - True Sound Geometry
 */

import { useEffect, useRef } from 'react';
import { useAudioAnalyzerContext } from '../../context/AudioAnalyzerContext';
import { usePlayer } from '../../context/PlayerContext';
import { particlePhysics } from '../../lib/motion';
import { Lightbulb, Waves, Sparkles, Dna, Hexagon, Orbit } from 'lucide-react';

type VisualizerMode = 'chladni' | 'water' | 'sacred' | 'turing' | 'voronoi' | 'hopf';

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
    const { analyzer, isInitialized, getFrequencyData } = useAudioAnalyzerContext();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationFrameRef = useRef<number | null>(null);
    const canvasSizeRef = useRef({ width: 800, height: 100 });

    // Handle canvas resize
    // ... (Resize logic remains the same)
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

            // 1. POLL PRE-CALCULATED DATA (Zero allocation, high performance)
            const audioData = getFrequencyData();
            if (!audioData) {
                animationFrameRef.current = requestAnimationFrame(animate);
                return;
            }

            const { bassEnergy, midEnergy, trebleEnergy, volume } = audioData;

            // Optimization: If silent, skip complex drawing but maintain loop
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

                } else if (mode === 'turing') {
                    const timePhase = currentTime * 0.002;
                    const killEffect = bassEnergy;
                    const feedEffect = midEnergy;
                    const diffusionWobble = trebleEnergy * 30;

                    const wormSize = Math.max(8, Math.floor(20 - volume * 12));
                    const wormIndex = Math.floor(index / wormSize);
                    const wormPosition = index % wormSize;
                    const totalWorms = Math.ceil(particles.length / wormSize);

                    const wormAngle = (wormIndex / totalWorms) * Math.PI * 2
                        + timePhase * (1 + bassEnergy * 3);

                    const baseRadius = width * 0.2;
                    const audioRadius = baseRadius + (bassEnergy * width * 0.25) + (midEnergy * width * 0.15);
                    const wormRadius = audioRadius + Math.sin(timePhase * 2 + wormIndex) * (width * 0.1) * (1 + volume);

                    const fragmentAngle = killEffect * Math.sin(index * 0.5 + timePhase * 5) * Math.PI * 0.5;
                    const fragmentDist = killEffect * Math.sin(index * 2 + timePhase * 3) * (width * 0.15);

                    const spineX = centerX + Math.cos(wormAngle + fragmentAngle) * (wormRadius + fragmentDist);
                    const spineY = centerY + Math.sin(wormAngle + fragmentAngle) * (wormRadius + fragmentDist);

                    const perpAngle = wormAngle + Math.PI / 2;
                    const baseSpread = (wormPosition - wormSize / 2) * (4 + feedEffect * 6);
                    const wobble = Math.sin(currentTime * 0.01 + index * 0.3) * diffusionWobble;

                    targetX = spineX + Math.cos(perpAngle) * baseSpread + wobble;
                    targetY = spineY + Math.sin(perpAngle) * baseSpread * 0.8 + wobble * 0.5;

                } else if (mode === 'voronoi') {
                    const timePhase = currentTime * 0.001;
                    const gridSize = Math.ceil(Math.sqrt(particles.length));
                    const gridX = index % gridSize;
                    const gridY = Math.floor(index / gridSize);

                    const cellWidth = width / gridSize;
                    const cellHeight = height / gridSize;

                    const baseX = (gridX + 0.5) * cellWidth;
                    const baseY = (gridY + 0.5) * cellHeight;

                    const dxFromCenter = baseX - centerX;
                    const dyFromCenter = baseY - centerY;
                    const distFromCenter = Math.sqrt(dxFromCenter * dxFromCenter + dyFromCenter * dyFromCenter) || 1;

                    const breathForce = (bassEnergy * 1.5 + volume * 0.8);
                    const breathX = (dxFromCenter / distFromCenter) * breathForce * (width * 0.3);
                    const breathY = (dyFromCenter / distFromCenter) * breathForce * (height * 0.3);

                    const wobbleX = Math.sin(timePhase * 3 + gridX * 0.5 + gridY * 0.3) * midEnergy * 40;
                    const wobbleY = Math.cos(timePhase * 3 + gridX * 0.3 + gridY * 0.5) * midEnergy * 40;

                    const shimmerX = Math.sin(currentTime * 0.02 + index * 0.1) * trebleEnergy * 20;
                    const shimmerY = Math.cos(currentTime * 0.02 + index * 0.07) * trebleEnergy * 20;

                    targetX = baseX + breathX + wobbleX + shimmerX;
                    targetY = baseY + breathY + wobbleY + shimmerY;

                } else if (mode === 'hopf') {
                    const timePhase = currentTime * 0.002;
                    const torusCount = 6;
                    const particlesPerTorus = Math.ceil(particles.length / torusCount);
                    const torusIndex = Math.floor(index / particlesPerTorus);
                    const posOnTorus = (index % particlesPerTorus) / particlesPerTorus;

                    const baseTorusRadius = (width * 0.06) + torusIndex * (width * 0.05);
                    const torusRadius = baseTorusRadius + (bassEnergy * width * 0.08);

                    const baseTubeRadius = (width * 0.02) + torusIndex * (width * 0.008);
                    const tubeRadius = baseTubeRadius + (volume * width * 0.015);

                    const baseSpeed = timePhase * 2;
                    let rotationSpeed: number;
                    let tubeRotation: number;

                    if (torusIndex < 2) {
                        rotationSpeed = baseSpeed * (3 + trebleEnergy * 8);
                        tubeRotation = baseSpeed * (5 + trebleEnergy * 10);
                    } else if (torusIndex < 4) {
                        rotationSpeed = baseSpeed * (2 + midEnergy * 5);
                        tubeRotation = baseSpeed * (3 + midEnergy * 6);
                    } else {
                        rotationSpeed = baseSpeed * (1 + bassEnergy * 4);
                        tubeRotation = baseSpeed * (2 + bassEnergy * 5);
                    }

                    const u = posOnTorus * Math.PI * 2 + rotationSpeed;
                    const v = posOnTorus * (torusIndex + 1) * Math.PI * 2 + tubeRotation;

                    const x3d = (torusRadius + tubeRadius * Math.cos(v)) * Math.cos(u);
                    const y3d = (torusRadius + tubeRadius * Math.cos(v)) * Math.sin(u);
                    const z3d = tubeRadius * Math.sin(v);

                    const perspective = 1 + z3d / (width * 0.5);
                    targetX = centerX + x3d * perspective;
                    targetY = centerY + y3d * perspective * 0.7;

                    const pulseStrength = (bassEnergy * 25) + (volume * 15);
                    targetX += Math.sin(v * 4 + timePhase * 8) * pulseStrength;
                    targetY += Math.cos(v * 4 + timePhase * 8) * pulseStrength * 0.5;
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

                let r, g, b;
                if (mode === 'chladni') { r = 212; g = 175; b = 55; }
                else if (mode === 'water') { r = 100 + (trebleEnergy * 100); g = 149 + (midEnergy * 50); b = 237; }
                else if (mode === 'sacred') { r = 230; g = 230; b = 230; }
                else if (mode === 'turing') { r = 50 + (bassEnergy * 50); g = 200 + (midEnergy * 55); b = 180 + (trebleEnergy * 75); }
                else if (mode === 'voronoi') { r = 200 + (midEnergy * 55); g = 140 + (bassEnergy * 50); b = 80 + (trebleEnergy * 40); }
                else { r = 180 + (bassEnergy * 75); g = 100 + (midEnergy * 50); b = 220 + (trebleEnergy * 35); }

                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
    }, [mode, analyzer, isInitialized, isPlaying]);

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
