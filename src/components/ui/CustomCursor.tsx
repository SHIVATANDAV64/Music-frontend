/**
 * Custom Cursor Component - SIMPLIFIED
 * 
 * Simple, performant cursor with mix-blend-mode.
 * No trails, no springs, no heavy animations.
 * Just a clean circle that follows the mouse.
 */
import { useEffect, useState, useRef } from 'react';

export function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const dotRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Check if mobile - don't render on mobile
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (isMobile) {
            setIsVisible(false);
            return;
        }

        // Use requestAnimationFrame for smooth performance
        let animationId: number;
        let mouseX = 0;
        let mouseY = 0;

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        // Efficient animation loop
        const animate = () => {
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate(${mouseX - 12}px, ${mouseY - 12}px)`;
            }
            if (dotRef.current) {
                dotRef.current.style.transform = `translate(${mouseX - 3}px, ${mouseY - 3}px)`;
            }
            animationId = requestAnimationFrame(animate);
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const isInteractive = Boolean(
                target.tagName === 'BUTTON' ||
                target.tagName === 'A' ||
                target.closest('button') ||
                target.closest('a') ||
                target.closest('[role="button"]') ||
                target.classList.contains('hoverable')
            );
            setIsHovering(isInteractive);
        };

        const handleMouseLeave = () => setIsVisible(false);
        const handleMouseEnter = () => setIsVisible(true);

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('mouseover', handleMouseOver, { passive: true });
        document.body.addEventListener('mouseleave', handleMouseLeave);
        document.body.addEventListener('mouseenter', handleMouseEnter);

        animationId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseover', handleMouseOver);
            document.body.removeEventListener('mouseleave', handleMouseLeave);
            document.body.removeEventListener('mouseenter', handleMouseEnter);
            cancelAnimationFrame(animationId);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <>
            {/* Main cursor ring */}
            <div
                ref={cursorRef}
                className={`
                    fixed top-0 left-0 pointer-events-none z-[99999]
                    rounded-full border-2 border-[var(--text-primary)]
                    mix-blend-difference transition-[width,height] duration-200
                    ${isHovering ? 'w-14 h-14 bg-white/10' : 'w-6 h-6'}
                `}
                style={{ willChange: 'transform' }}
            />

            {/* Center dot */}
            {!isHovering && (
                <div
                    ref={dotRef}
                    className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-[var(--text-primary)] pointer-events-none z-[100000] mix-blend-difference"
                    style={{ willChange: 'transform' }}
                />
            )}
        </>
    );
}
