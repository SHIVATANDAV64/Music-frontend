import { useEffect, useRef } from 'react';

/**
 * AuroraNebula - Flowing aurora borealis with cosmic particle dust
 * Premium, ethereal visualization for auth pages
 */
export const AuroraNebula = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = canvas.offsetWidth;
        let height = canvas.offsetHeight;
        let time = 0;

        let mouseX = width / 2;
        let mouseY = height / 2;
        let targetMouseX = width / 2;
        let targetMouseY = height / 2;

        // ─── STAR FIELD ───
        interface Star {
            x: number;
            y: number;
            size: number;
            twinkleSpeed: number;
            twinkleOffset: number;
            brightness: number;
        }

        const stars: Star[] = [];
        const STAR_COUNT = 150;

        const generateStarField = () => {
            stars.length = 0;
            for (let i = 0; i < STAR_COUNT; i++) {
                stars.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    size: Math.random() * 1.5 + 0.5,
                    twinkleSpeed: Math.random() * 2 + 1,
                    twinkleOffset: Math.random() * Math.PI * 2,
                    brightness: Math.random() * 0.5 + 0.3
                });
            }
        };

        // ─── FLOATING PARTICLES ───
        interface FloatingParticle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            hue: number;
            life: number;
            maxLife: number;
        }

        const floatingParticles: FloatingParticle[] = [];
        const MAX_FLOATING = 60;

        const spawnFloatingParticle = () => {
            if (floatingParticles.length >= MAX_FLOATING) return;

            floatingParticles.push({
                x: Math.random() * width,
                y: height + 20,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -Math.random() * 0.8 - 0.3,
                size: Math.random() * 3 + 1,
                hue: Math.random() > 0.5 ? 180 + Math.random() * 40 : 280 + Math.random() * 40,
                life: 0,
                maxLife: Math.random() * 400 + 200
            });
        };

        const handleResize = () => {
            width = canvas.offsetWidth || window.innerWidth;
            height = canvas.offsetHeight || window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            generateStarField();
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            targetMouseX = e.clientX - rect.left;
            targetMouseY = e.clientY - rect.top;
        };

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(canvas);
        canvas.addEventListener('mousemove', handleMouseMove);
        handleResize();

        const draw = () => {
            if (!ctx) return;

            // Background with subtle gradient
            const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
            bgGradient.addColorStop(0, '#050508');
            bgGradient.addColorStop(0.5, '#080812');
            bgGradient.addColorStop(1, '#050508');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, width, height);

            time += 0.008;

            // Smooth mouse
            mouseX += (targetMouseX - mouseX) * 0.03;
            mouseY += (targetMouseY - mouseY) * 0.03;

            const mouseInfluenceY = (mouseY / height - 0.5) * 0.2;

            // ═══ DRAW AURORA RIBBONS ═══
            const ribbonCount = 4;

            for (let r = 0; r < ribbonCount; r++) {
                ctx.save();
                ctx.globalCompositeOperation = 'screen';

                const ribbonOffset = r * 0.7;
                const ribbonY = height * (0.3 + r * 0.15);

                // Aurora gradient colors
                const hue1 = (130 + r * 40 + Math.sin(time + r) * 20) % 360;
                const hue2 = (180 + r * 30 + Math.cos(time * 0.7 + r) * 25) % 360;
                const hue3 = (280 + r * 20 + Math.sin(time * 0.5 + r) * 30) % 360;

                // Draw multiple layers for glow effect
                for (let layer = 0; layer < 3; layer++) {
                    const layerAlpha = (0.15 - layer * 0.04) * (1 + Math.sin(time * 2 + r) * 0.3);
                    const layerBlur = 30 + layer * 20;

                    ctx.beginPath();
                    ctx.moveTo(0, ribbonY);

                    // Bezier curves for flowing ribbon
                    const segments = 6;
                    for (let s = 0; s <= segments; s++) {
                        const segX = (s / segments) * width;

                        // Multiple sine waves for organic movement
                        const wave1 = Math.sin(time * 1.2 + segX * 0.003 + ribbonOffset) * 60;
                        const wave2 = Math.sin(time * 0.8 + segX * 0.005 + ribbonOffset * 2) * 30;
                        const wave3 = Math.sin(time * 0.4 + segX * 0.002) * 40;
                        const mouseWave = Math.sin(segX * 0.01) * mouseInfluenceY * 100;

                        const segY = ribbonY + wave1 + wave2 + wave3 + mouseWave;

                        if (s === 0) {
                            ctx.moveTo(segX, segY);
                        } else {
                            const prevX = ((s - 1) / segments) * width;
                            const cpX = (prevX + segX) / 2;
                            ctx.quadraticCurveTo(cpX, segY + Math.sin(time + s) * 20, segX, segY);
                        }
                    }

                    // Complete the ribbon shape
                    ctx.lineTo(width, height);
                    ctx.lineTo(0, height);
                    ctx.closePath();

                    // Create aurora gradient
                    const gradient = ctx.createLinearGradient(0, ribbonY - 100, 0, ribbonY + 200);
                    gradient.addColorStop(0, `hsla(${hue1}, 80%, 60%, 0)`);
                    gradient.addColorStop(0.2, `hsla(${hue1}, 70%, 55%, ${layerAlpha})`);
                    gradient.addColorStop(0.4, `hsla(${hue2}, 80%, 50%, ${layerAlpha * 0.8})`);
                    gradient.addColorStop(0.6, `hsla(${hue3}, 70%, 45%, ${layerAlpha * 0.5})`);
                    gradient.addColorStop(1, `hsla(${hue3}, 60%, 30%, 0)`);

                    ctx.fillStyle = gradient;
                    ctx.filter = `blur(${layerBlur}px)`;
                    ctx.fill();
                    ctx.filter = 'none';
                }

                ctx.restore();
            }

            // ═══ DRAW STARS ═══
            for (const star of stars) {
                const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.5 + 0.5;
                const alpha = star.brightness * twinkle;

                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();

                // Star glow
                if (star.size > 1) {
                    const glowGradient = ctx.createRadialGradient(
                        star.x, star.y, 0,
                        star.x, star.y, star.size * 4
                    );
                    glowGradient.addColorStop(0, `rgba(200, 220, 255, ${alpha * 0.3})`);
                    glowGradient.addColorStop(1, 'transparent');
                    ctx.fillStyle = glowGradient;
                    ctx.beginPath();
                    ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // ═══ FLOATING PARTICLES ═══
            if (Math.random() < 0.15) spawnFloatingParticle();

            for (let i = floatingParticles.length - 1; i >= 0; i--) {
                const p = floatingParticles[i];

                p.life++;
                p.x += p.vx + Math.sin(time * 2 + p.y * 0.01) * 0.3;
                p.y += p.vy;
                p.vx += (Math.random() - 0.5) * 0.02;

                // Fade in and out
                const lifeRatio = p.life / p.maxLife;
                const fadeIn = Math.min(p.life / 30, 1);
                const fadeOut = Math.max(1 - (lifeRatio - 0.7) / 0.3, 0);
                const alpha = fadeIn * fadeOut * 0.7;

                if (p.life > p.maxLife || p.y < -20) {
                    floatingParticles.splice(i, 1);
                    continue;
                }

                // Particle glow
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
                gradient.addColorStop(0, `hsla(${p.hue}, 70%, 70%, ${alpha})`);
                gradient.addColorStop(0.5, `hsla(${p.hue}, 60%, 50%, ${alpha * 0.3})`);
                gradient.addColorStop(1, 'transparent');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                ctx.fill();

                // Core
                ctx.fillStyle = `hsla(${p.hue}, 50%, 90%, ${alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // ═══ SUBTLE VIGNETTE ═══
            const vignette = ctx.createRadialGradient(
                width / 2, height / 2, height * 0.2,
                width / 2, height / 2, height * 0.9
            );
            vignette.addColorStop(0, 'transparent');
            vignette.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, width, height);

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            resizeObserver.disconnect();
            canvas.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
        />
    );
};
