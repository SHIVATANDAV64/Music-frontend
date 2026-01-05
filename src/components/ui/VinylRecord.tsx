/**
 * Vinyl Record Component
 * Spinning vinyl animation with album cover
 */
import { motion } from 'framer-motion';
import { usePlayer } from '../../context/PlayerContext';
import { getTrackCoverUrl } from '../../utils/trackUtils';
import type { Track } from '../../types';

export function VinylRecord() {
    const { currentTrack, isPlaying } = usePlayer();

    if (!currentTrack) return null;

    // Source-aware cover URL (only for Track type)
    const coverUrl = 'source' in currentTrack
        ? getTrackCoverUrl(currentTrack as Track, 400, 400)
        : null;

    return (
        <div className="relative w-64 h-64 mx-auto">
            {/* Vinyl base */}
            <motion.div
                className={`vinyl ${isPlaying ? 'spinning' : ''}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' as const }}
            >
                {/* Album cover in center */}
                {coverUrl && (
                    <div className="vinyl-cover">
                        <motion.img
                            src={coverUrl}
                            alt={currentTrack.title}
                            animate={{ rotate: isPlaying ? 360 : 0 }}
                            transition={{
                                duration: 3,
                                repeat: isPlaying ? Infinity : 0,
                                ease: 'linear',
                            }}
                        />
                    </div>
                )}
            </motion.div>

            {/* Glow effect when playing */}
            {isPlaying && (
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(201, 169, 98, 0.2) 0%, transparent 70%)',
                        filter: 'blur(20px)',
                    }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            )}
        </div>
    );
}
