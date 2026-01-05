/**
 * AuroraWaves Component
 * 5-layer aurora effect with bass-reactive colors and twinkling stars.
 * Based on music-player-frontend's AuroraWaves.jsx
 */

import { useRef, useEffect } from 'react';

interface AuroraWavesProps {
    /** Web Audio analyser node for audio reactivity */
    analyser?: AnalyserNode | null;
    /** Whether audio is playing */
    isPlaying?: boolean;
    /** CSS class name */
    className?: string;
}

export function AuroraWaves({ analyser, isPlaying = false, className = '' }: AuroraWavesProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let time = 0;
        let animationId: number | null = null;
        const frequencyData = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.scale(dpr, dpr);
        };

        resize();
        window.addEventListener('resize', resize);

        const animate = () => {
            const width = canvas.width / (window.devicePixelRatio || 1);
            const height = canvas.height / (window.devicePixelRatio || 1);

            // Forest-at-dusk gradient background
            const gradientBg = ctx.createLinearGradient(0, 0, 0, height);
            gradientBg.addColorStop(0, '#0a0a0a');
            gradientBg.addColorStop(0.3, '#0a0f0a');
            gradientBg.addColorStop(0.7, '#0f0a0a');
            gradientBg.addColorStop(1, '#0a0a0a');
            ctx.fillStyle = gradientBg;
            ctx.fillRect(0, 0, width, height);

            // Get bass level from audio or simulate
            let bass = 0.2;
            if (analyser && frequencyData) {
                if (isPlaying) analyser.getByteFrequencyData(frequencyData);
                // Average of first 12 bins (bass frequencies)
                let sum = 0;
                for (let i = 0; i < 12; i++) {
                    sum += frequencyData[i];
                }
                bass = sum / (12 * 255);
            } else if (!isPlaying) {
                bass = 0.1 + Math.sin(time * 0.01) * 0.05;
            }

            // 5 Aurora layers
            for (let layer = 0; layer < 5; layer++) {
                const speed = 0.3 + layer * 0.2;
                const yOffset = ((time * speed) % height) - 100;

                // Aurora gradient for each layer - gold/amber/sage tones (forest-at-dusk)
                const gradient = ctx.createLinearGradient(0, yOffset, width, yOffset + 200);

                // Dynamic colors based on layer and bass
                const hue1 = 40 + layer * 10 + bass * 20;  // Gold
                const hue2 = 30 + layer * 8 + bass * 15;   // Amber
                const hue3 = 80 + layer * 5 + bass * 10;   // Sage green

                gradient.addColorStop(0, `hsla(${hue1}, 50%, 25%, 0.05)`);
                gradient.addColorStop(0.2, `hsla(${hue1}, 60%, 35%, ${0.15 + bass * 0.2})`);
                gradient.addColorStop(0.5, `hsla(${hue2}, 55%, 40%, ${0.25 + bass * 0.15})`);
                gradient.addColorStop(0.8, `hsla(${hue3}, 40%, 30%, ${0.1 + bass * 0.1})`);
                gradient.addColorStop(1, `hsla(${hue3}, 30%, 20%, 0.02)`);

                ctx.fillStyle = gradient;
                ctx.save();
                ctx.globalCompositeOperation = 'screen'; // Glow effect

                ctx.beginPath();
                ctx.moveTo(0, yOffset + 80);

                // Smooth aurora waves
                for (let x = 0; x < width; x += 3) {
                    const wave1 = Math.sin((x * 0.003 + time * 0.02 + layer) * 0.7) * 35;
                    const wave2 = Math.sin((x * 0.007 - time * 0.015 + layer * 2) * 1.3) * 20;
                    const wave3 = Math.sin((x * 0.012 + time * 0.01 + layer * 3) * 2.1) * 12;
                    const waveHeight = wave1 + wave2 * 0.6 + wave3 * 0.3 + bass * 60;

                    ctx.lineTo(x, yOffset + 80 + waveHeight);
                }

                ctx.lineTo(width, height + 100);
                ctx.lineTo(0, height + 100);
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            }

            // Subtle stars
            ctx.fillStyle = 'rgba(250, 250, 245, 0.6)';
            for (let i = 0; i < 40; i++) {
                const x = ((time * 0.3 + i * 137.5) % width);
                const y = (i * 73.9) % height;
                const size = 0.8 + Math.sin(time * 0.05 + i) * 0.3;

                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }

            time += 0.5;
            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationId) cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
        };
    }, [analyser, isPlaying]);

    return (
        <div className={`fixed inset-0 w-full h-full -z-10 pointer-events-none ${className}`}>
            <canvas
                ref={canvasRef}
                className="w-full h-full"
            />
        </div>
    );
}

export default AuroraWaves;
