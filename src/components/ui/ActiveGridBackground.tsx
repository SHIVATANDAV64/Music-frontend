
import { useEffect, useRef } from 'react';

export const ActiveGridBackground = () => {
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

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        const handleMouseMove = (e: MouseEvent) => {
            // Smooth lerp could be added here, but direct mapping is snappier for "technical" feel
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        handleResize();

        // Grid parameters
        const gridSize = 40;
        const speed = 0.5;
        let offset = 0;

        const draw = () => {
            if (!ctx) return;
            ctx.fillStyle = '#050505'; // bg-void
            ctx.fillRect(0, 0, width, height);

            // Perspective Grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;

            // Vertical lines (converging)
            const centerX = width / 2;
            const centerY = height / 2;

            // Calculate mouse influence
            const parallaxX = (mouseX - centerX) * 0.05;
            const parallaxY = (mouseY - centerY) * 0.05;

            // Moving Horizontal Lines
            offset = (offset + speed) % gridSize;

            ctx.beginPath();

            // Vertical Lines
            for (let x = 0; x <= width; x += gridSize * 2) {
                ctx.moveTo(x + parallaxX, 0);
                ctx.lineTo(x - parallaxX, height);
            }

            // Horizontal Lines (scrolling down)
            for (let y = offset; y <= height; y += gridSize) {
                ctx.moveTo(0, y + parallaxY);
                ctx.lineTo(width, y - parallaxY);
            }

            ctx.stroke();

            // "Digital Dust" / Particles
            // Randomly flicker some intersections
            if (Math.random() > 0.8) {
                ctx.fillStyle = '#FFFFFF';
                const rx = Math.floor(Math.random() * width);
                const ry = Math.floor(Math.random() * height);
                // Snap to gridish
                const snapX = Math.round(rx / gridSize) * gridSize + (offset % gridSize);
                ctx.fillRect(snapX, ry, 2, 2);
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
            className="fixed inset-0 z-0 h-full w-full pointer-events-none mix-blend-screen opacity-50"
        />
    );
};
