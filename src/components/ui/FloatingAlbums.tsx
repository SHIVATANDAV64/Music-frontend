/**
 * FloatingAlbums - 3D Parallax Floating Album Covers
 * Creates an immersive effect with album covers floating and reacting to mouse movement
 * Used in hero sections for premium visual impact
 */
import { useRef, useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { getTrackCoverUrl } from '../../utils/trackUtils';
import type { Track } from '../../types';

interface FloatingAlbumsProps {
    /** Tracks to display album covers from */
    tracks: Track[];
    /** Additional CSS classes */
    className?: string;
}

interface AlbumPosition {
    x: number;
    y: number;
    z: number;
    rotate: number;
    scale: number;
}

// Predefined positions for floating albums - creates artistic scattered layout
const ALBUM_POSITIONS: AlbumPosition[] = [
    { x: 10, y: 15, z: 60, rotate: -15, scale: 0.9 },
    { x: 75, y: 10, z: 40, rotate: 12, scale: 0.85 },
    { x: 85, y: 55, z: 80, rotate: -8, scale: 1 },
    { x: 5, y: 60, z: 30, rotate: 18, scale: 0.8 },
    { x: 60, y: 70, z: 50, rotate: -5, scale: 0.75 },
    { x: 35, y: 5, z: 70, rotate: 8, scale: 0.7 },
];

export function FloatingAlbums({ tracks, className = '' }: FloatingAlbumsProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);

    // Mouse position tracking
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth spring for mouse following
    const springConfig = { damping: 30, stiffness: 150 };
    const smoothX = useSpring(mouseX, springConfig);
    const smoothY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Normalize to -1 to 1 range
            const x = (e.clientX - centerX) / (rect.width / 2);
            const y = (e.clientY - centerY) / (rect.height / 2);

            mouseX.set(x);
            mouseY.set(y);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    // Limit to first 6 tracks with covers (either cover_url or cover_image_id)
    const albumTracks = tracks
        .filter(t => t.cover_url || t.cover_image_id)
        .slice(0, 6);

    return (
        <div
            ref={containerRef}
            className={`floating-albums-container relative w-full h-full ${className}`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {albumTracks.map((track, index) => {
                const pos = ALBUM_POSITIONS[index];
                // Source-aware cover URL
                const coverUrl = getTrackCoverUrl(track, 200, 200);

                // Skip if no cover URL
                if (!coverUrl) return null;

                // Calculate parallax offset based on z-depth
                const parallaxMultiplier = pos.z / 100;

                return (
                    <FloatingAlbum
                        key={track.$id}
                        coverUrl={coverUrl}
                        title={track.title}
                        position={pos}
                        smoothX={smoothX}
                        smoothY={smoothY}
                        parallaxMultiplier={parallaxMultiplier}
                        isHovering={isHovering}
                        delay={index * 0.15}
                    />
                );
            })}
        </div>
    );
}

interface FloatingAlbumProps {
    coverUrl: string;
    title: string;
    position: AlbumPosition;
    smoothX: ReturnType<typeof useSpring>;
    smoothY: ReturnType<typeof useSpring>;
    parallaxMultiplier: number;
    isHovering: boolean;
    delay: number;
}

function FloatingAlbum({
    coverUrl,
    title,
    position,
    smoothX,
    smoothY,
    parallaxMultiplier,
    isHovering,
    delay,
}: FloatingAlbumProps) {
    // Transform mouse position to parallax movement
    const x = useTransform(smoothX, [-1, 1], [-30 * parallaxMultiplier, 30 * parallaxMultiplier]);
    const y = useTransform(smoothY, [-1, 1], [-20 * parallaxMultiplier, 20 * parallaxMultiplier]);
    const rotateY = useTransform(smoothX, [-1, 1], [-15 * parallaxMultiplier, 15 * parallaxMultiplier]);
    const rotateX = useTransform(smoothY, [-1, 1], [10 * parallaxMultiplier, -10 * parallaxMultiplier]);

    return (
        <motion.div
            className="floating-album"
            style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                width: `${80 * position.scale}px`,
                height: `${80 * position.scale}px`,
                x,
                y,
                rotateY,
                rotateX,
                zIndex: Math.round(position.z),
            }}
            initial={{
                opacity: 0,
                scale: 0.5,
                rotate: position.rotate - 20,
            }}
            animate={{
                opacity: 1,
                scale: position.scale,
                rotate: position.rotate,
            }}
            transition={{
                duration: 1,
                delay,
                ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={{
                scale: position.scale * 1.15,
                zIndex: 100,
                rotate: 0,
                transition: { duration: 0.3 }
            }}
        >
            {/* Glow effect */}
            <div
                className="absolute inset-0 rounded-2xl"
                style={{
                    background: 'radial-gradient(circle, var(--violet-glow) 0%, transparent 70%)',
                    filter: 'blur(20px)',
                    opacity: isHovering ? 0.6 : 0.3,
                    transition: 'opacity 0.3s',
                }}
            />

            {/* Album cover image */}
            <img
                src={coverUrl}
                alt={title}
                className="relative w-full h-full object-cover rounded-2xl"
                loading="lazy"
            />

            {/* Shine effect */}
            <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, transparent 100%)',
                }}
            />
        </motion.div>
    );
}
