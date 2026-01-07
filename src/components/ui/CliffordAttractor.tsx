import { useEffect, useRef } from 'react';

/**
 * CliffordAttractor - A visualization of mathematical chaos
 * 
 * Renders a strange attractor fractal using the Clifford equations:
 * x_n+1 = sin(a * y_n) + c * cos(a * x_n)
 * y_n+1 = sin(b * x_n) + d * cos(b * y_n)
 * 
 * Creates a premium, silk-like texture through millions of iterations.
 */
export const CliffordAttractor = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: false }); // Optimization: alpha false
        if (!ctx) return;

        let width = canvas.offsetWidth;
        let height = canvas.offsetHeight;
        let animationFrameId: number;

        // Configuration
        const ITERATIONS_PER_FRAME = 30000; // High count for density
        const TRAIL_OPACITY = 0.05; // Very slow fade for "exposure" effect
        const SCALE = 250; // Zoom level

        // State
        let x = 0, y = 0;
        let time = 0;

        // Parameters (Starting at a known beautiful configuration)
        // Set A: -1.7, 1.3, -0.1, -1.2
        let a = -1.7;
        let b = 1.3;
        let c = -0.1;
        let d = -1.2;

        let mouseX = width / 2;
        let mouseY = height / 2;
        let targetA = a;
        let targetB = b;

        const handleResize = () => {
            width = canvas.offsetWidth || window.innerWidth;
            height = canvas.offsetHeight || window.innerHeight;
            canvas.width = width;
            canvas.height = height;

            // Initial clear
            ctx.fillStyle = '#050508'; // bg-void
            ctx.fillRect(0, 0, width, height);
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        };

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(canvas);
        canvas.addEventListener('mousemove', handleMouseMove);
        handleResize();

        const draw = () => {
            if (!ctx) return;

            // 1. Fade out (Trail effect)
            // Instead of clearing, we draw a semi-transparent black rectangle
            // This allows the attractor to "burn in" to the canvas
            ctx.fillStyle = `rgba(5, 5, 8, ${TRAIL_OPACITY})`;
            ctx.fillRect(0, 0, width, height);

            // 2. Evolve parameters slowly (Organic motion)
            time += 0.002;

            // Mouse influence on parameters (Chaos theory - sensitive dependence)
            const mouseFactorX = (mouseX / width - 0.5) * 0.1;
            const mouseFactorY = (mouseY / height - 0.5) * 0.1;

            // Base drift
            targetA = -1.7 + Math.sin(time * 0.5) * 0.2 + mouseFactorX;
            targetB = 1.3 + Math.cos(time * 0.3) * 0.2 + mouseFactorY;

            // Smooth interpolation
            a += (targetA - a) * 0.02;
            b += (targetB - b) * 0.02;
            // c and d can also evolve for more complex movement
            c = -0.1 + Math.sin(time * 0.2) * 0.05;
            d = -1.2 + Math.cos(time * 0.4) * 0.05;

            // 3. Render Iterations
            // We use 'lighter' composite operation to add up brightness where points overlap
            // This creates the "density map" look
            ctx.globalCompositeOperation = 'lighter';

            const centerX = width / 2;
            const centerY = height / 2;

            // Optimization: Batch drawing
            // However, for single pixel particles, direct pixel manipulation (ImageData) 
            // is fastest, but fillRect with 1x1 is easier to leverage blending modes.
            // Let's stick to fillRect(1x1) with low alpha for the beautiful blend.

            ctx.fillStyle = 'rgba(100, 200, 255, 0.03)'; // Very faint Cyan/Blue

            for (let i = 0; i < ITERATIONS_PER_FRAME; i++) {
                // Clifford Attractor Equations
                const xn = Math.sin(a * y) + c * Math.cos(a * x);
                const yn = Math.sin(b * x) + d * Math.cos(b * y);
                x = xn;
                y = yn;

                // Transform to canvas coordinates
                const plotX = centerX + x * SCALE;
                const plotY = centerY + y * SCALE;

                // Color variation based on position or iteration?
                // For performance, static color is best, but let's try subtle variation
                // ctx.fillStyle = `hsla(${200 + x * 20}, 70%, 60%, 0.03)`; // Too expensive to change context every pixel

                ctx.fillRect(plotX, plotY, 1, 1);
            }

            // Add a "Golden" layer for contrast (optional, fewer iterations)
            ctx.fillStyle = 'rgba(255, 200, 100, 0.03)'; // Faint Gold
            let gx = x, gy = y;
            for (let i = 0; i < ITERATIONS_PER_FRAME / 3; i++) {
                // Slightly different parameters or just offset?
                // Let's reuse equations but vary 'd' slightly for a "shadow" or "highlight" attractor
                const gxn = Math.sin(a * gy) + c * Math.cos(a * gx);
                const gyn = Math.sin(b * gx) + (d + 0.05) * Math.cos(b * gy);
                gx = gxn;
                gy = gyn;

                const plotX = centerX + gx * SCALE;
                const plotY = centerY + gy * SCALE;
                ctx.fillRect(plotX, plotY, 1, 1);
            }

            ctx.globalCompositeOperation = 'source-over'; // Reset

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
            style={{ filter: 'contrast(1.2) brightness(1.2)' }} // Enhance the dynamic range
        />
    );
};
