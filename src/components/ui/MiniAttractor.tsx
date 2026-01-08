import { useEffect, useRef } from 'react';

/**
 * MiniAttractor - Rotating Clifford Border
 * 
 * Renders the silky Clifford attractor structure, but:
 * 1. Constrains it to the border edges (masking the center).
 * 2. Slowly rotates rotation to create a "running loops" effect around the perimeter.
 */
export const MiniAttractor = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        let animationFrameId: number;
        let width = 0;
        let height = 0;

        const handleResize = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            width = parent.offsetWidth;
            height = parent.offsetHeight;
            canvas.width = width;
            canvas.height = height;
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        // State
        let time = 0;
        // Seed random starting positions
        let x = 0.1, y = 0.1;

        // Base Clifford parameters (Chaos)
        // a, b, c, d determine the shape or "texture" of the attractor
        let a = -1.7, b = 1.8, c = -0.9, d = -0.4;

        const draw = () => {
            if (!ctx || width === 0) {
                animationFrameId = requestAnimationFrame(draw);
                return;
            }

            // 1. Fade out (Motion blur trail)
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; // Stronger fade for cleaner lines
            ctx.fillRect(0, 0, width, height);

            // 2. Setup rendering
            ctx.globalCompositeOperation = 'lighter';

            // Advance time for rotation and parameter evolution
            time += 0.005;

            // Subtle parameter breathing to make it feel "alive"
            const currentA = a + Math.sin(time * 0.5) * 0.02;
            const currentB = b + Math.cos(time * 0.3) * 0.02;

            const cx = width / 2;
            const cy = height / 2;
            // Scale: fit ~4 coordinate units into the button dimension
            // 4.0 is typical Clifford range (-2 to 2)
            const scale = Math.max(width, height) / 3.5;

            const iterations = 1500; // Density
            const borderWidth = 6;   // How thick the visible border is

            // Rotation angle (makes it "run" around the button)
            const angle = time * 0.5;
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);

            // Draw Loop
            for (let i = 0; i < iterations; i++) {
                // Clifford Equations
                const xn = Math.sin(currentA * y) + c * Math.cos(currentA * x);
                const yn = Math.sin(currentB * x) + d * Math.cos(currentB * y);
                x = xn;
                y = yn;

                // Rotate the point space to simulate "orbiting"
                const rx = x * cosA - y * sinA;
                const ry = x * sinA + y * cosA;

                // Map to screen
                const plotX = cx + rx * scale;
                const plotY = cy + ry * scale;

                // Border Mask Logic
                // We only draw if the point lands near the edge of the box
                // Check distance from each edge
                const distLeft = plotX;
                const distRight = width - plotX;
                const distTop = plotY;
                const distBottom = height - plotY;

                // If within border zone
                if (
                    (plotX >= 0 && plotX <= width && plotY >= 0 && plotY <= height) && // Inside bounds
                    (distLeft < borderWidth || distRight < borderWidth || distTop < borderWidth || distBottom < borderWidth) // Is border
                ) {

                    // Color Logic based on position/time
                    // Gold + Blue mix
                    const colorMix = Math.sin(rx * 2 + time) * 0.5 + 0.5; // 0 to 1

                    if (Math.random() > 0.5) {
                        ctx.fillStyle = `rgba(100, 200, 255, ${0.3 + colorMix * 0.2})`; // Cyan
                    } else {
                        ctx.fillStyle = `rgba(255, 200, 100, ${0.3 + (1 - colorMix) * 0.2})`; // Gold
                    }

                    ctx.fillRect(plotX, plotY, 1.5, 1.5);
                }
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ filter: 'contrast(1.2)' }}
        />
    );
};
