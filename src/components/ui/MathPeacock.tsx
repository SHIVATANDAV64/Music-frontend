
import { useEffect, useRef } from 'react';

export const MathPeacock = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        let animationFrameId: number;
        let mouseX = width / 2;
        let mouseY = height / 2;
        let time = 0;

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        handleResize();

        // ─── Mathematical Constants ───
        const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ~2.399 radians (137.5 degrees)
        const PARTICLE_COUNT = 1500;

        const draw = () => {
            if (!ctx) return;

            // Check for forced dark theme (local parent) or global dark theme
            const isDark = canvas.closest('.dark') !== null || document.documentElement.classList.contains('dark');

            // Trail effect: Fade out previous frame slightly instead of full clear
            // Dark mode: rgb(5,5,5) | Light mode: rgb(250,243,237) matching Peach White (#FAF3ED)
            ctx.fillStyle = isDark ? 'rgba(5, 5, 5, 0.2)' : 'rgba(250, 243, 237, 0.2)';
            ctx.fillRect(0, 0, width, height);

            const centerX = width / 2;
            const centerY = height * 0.8; // Anchor at bottom center (peacock body)

            // Interaction calculation
            const dx = mouseX - centerX;
            const dy = mouseY - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const interactionFactor = Math.min(dist / 500, 1); // 0 (close) to 1 (far)

            // Breathing function
            const breath = Math.sin(time * 0.5) * 0.1 + 1; // 0.9 to 1.1

            time += 0.01;

            for (let i = 0; i < PARTICLE_COUNT; i++) {
                // ─── PHYLLOTAXIS ALGORITHM ───
                // r = c * sqrt(n)
                // theta = n * 137.5 deg

                // Radius expands with index
                // We add a 'wave' to the radius to simulate feather layers
                const radiusBase = 15 * Math.sqrt(i) * breath;

                // Angle is pure Golden Angle
                let theta = i * GOLDEN_ANGLE;

                // ─── THE DANCE (Math Modulation) ───
                // Twist the theta based on time to make it 'sway'
                const sway = Math.sin(time * 0.5 + i * 0.01) * 0.1 * interactionFactor;
                theta += sway;

                // Convert to Cartesian
                let x = centerX + Math.cos(theta) * radiusBase;
                let y = centerY - Math.sin(theta) * radiusBase; // Negative sin to grow UPWARDS

                // Color Mathematics (Structural Coloration Simulation)
                // Map index to HSL: 
                // Inner (low i) -> Blue/Void
                // Middle -> Cyan/Teal
                // Outer (high i) -> Gold/Green (The 'Eyes')

                let hue = 220 + (i * 0.1) % 60; // Base Blue-Cyan range
                if (i > PARTICLE_COUNT * 0.8) {
                    hue = 45 + Math.sin(time + i) * 10; // Gold tips
                }

                const lightness = 50 + Math.sin(time * 2 + i * 0.1) * 20;

                ctx.fillStyle = `hsla(${hue}, 80%, ${lightness}%, 0.8)`;

                // Dynamic Size
                const size = Math.max(0.5, (i / PARTICLE_COUNT) * 2.5);

                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 h-full w-full pointer-events-none"
            style={{ mixBlendMode: 'screen' }}
        />
    );
};
