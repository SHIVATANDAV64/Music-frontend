/**
 * Music Page
 * Browse and filter music tracks with improved genre UI and infinite scroll
 * 
 * Design: Luxury aesthetic with gold accents
 */
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Music, Disc3, Mic2, Guitar, Radio, Headphones, Piano, Sparkles } from 'lucide-react';
import { MusicCard } from '../components/cards';
import { SkeletonGrid } from '../components/ui';
import { musicService } from '../services';
import { usePlayer } from '../context/PlayerContext';
import { useInfiniteScroll } from '../hooks';
import type { Track } from '../types';

// Genre configuration with icons
const GENRES = [
    { id: 'All', label: 'All', icon: Music },
    { id: 'Pop', label: 'Pop', icon: Sparkles },
    { id: 'Rock', label: 'Rock', icon: Guitar },
    { id: 'Hip-Hop', label: 'Hip-Hop', icon: Mic2 },
    { id: 'Electronic', label: 'Electronic', icon: Radio },
    { id: 'Classical', label: 'Classical', icon: Piano },
    { id: 'Jazz', label: 'Jazz', icon: Disc3 },
    { id: 'R&B', label: 'R&B', icon: Headphones },
];

const TRACKS_PER_PAGE = 20;

export function MusicPage() {
    const { setQueue } = usePlayer();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [selectedGenre, setSelectedGenre] = useState('All');
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Load tracks function
    const loadTracks = useCallback(async (reset: boolean = false) => {
        const currentPage = reset ? 1 : page;

        try {
            const data = await musicService.getTracks({
                genre: selectedGenre === 'All' ? undefined : selectedGenre,
                limit: TRACKS_PER_PAGE,
                offset: (currentPage - 1) * TRACKS_PER_PAGE,
            });

            if (reset) {
                setTracks(data);
                setPage(2);
            } else {
                setTracks(prev => {
                    const existingIds = new Set(prev.map(t => t.$id));
                    const newTracks = data.filter(t => !existingIds.has(t.$id));
                    return [...prev, ...newTracks];
                });
                setPage(prev => prev + 1);
            }

            setHasMore(data.length === TRACKS_PER_PAGE);

            // Set queue for Spotify-like navigation
            if (reset && data.length > 0) {
                setQueue(data);
            }
        } catch (error) {
            console.error('Failed to load tracks:', error);
        }
    }, [selectedGenre, page, setQueue]);

    // Initial load and genre change
    useEffect(() => {
        setIsLoading(true);
        setHasMore(true);
        loadTracks(true).finally(() => setIsLoading(false));
    }, [selectedGenre]);

    // Infinite scroll
    const handleLoadMore = useCallback(async () => {
        await loadTracks(false);
    }, [loadTracks]);

    const { sentinelRef, isLoadingMore } = useInfiniteScroll(handleLoadMore, hasMore);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#c9a962]/10 flex items-center justify-center">
                    <Music size={28} className="text-[#c9a962]" />
                </div>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-[#fafaf5]">Music</h1>
                    <p className="text-[#fafaf5]/50">Browse all tracks</p>
                </div>
            </div>

            {/* Genre Filter - Improved UI */}
            <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {GENRES.map((genre) => {
                    const Icon = genre.icon;
                    const isActive = selectedGenre === genre.id;

                    return (
                        <motion.button
                            key={genre.id}
                            onClick={() => setSelectedGenre(genre.id)}
                            className={`
                                flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap 
                                transition-all duration-300 border
                                ${isActive
                                    ? 'bg-[#c9a962] text-[#050505] border-[#c9a962]'
                                    : 'bg-transparent text-[#fafaf5]/60 border-[#fafaf5]/10 hover:border-[#c9a962]/50 hover:text-[#c9a962]'
                                }
                            `}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Icon size={16} />
                            {genre.label}
                        </motion.button>
                    );
                })}
            </div>

            {/* Tracks Grid */}
            {isLoading ? (
                <SkeletonGrid count={8} />
            ) : tracks.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20"
                >
                    <div className="w-20 h-20 rounded-full bg-[#c9a962]/10 flex items-center justify-center mx-auto mb-6">
                        <Music size={40} className="text-[#c9a962]/50" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-[#fafaf5]">No tracks found</h3>
                    <p className="text-[#fafaf5]/50 max-w-sm mx-auto">
                        {selectedGenre === 'All'
                            ? "There are no tracks yet. Check back later!"
                            : `No tracks in ${selectedGenre} category. Try another genre.`}
                    </p>
                </motion.div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                        {tracks.map((track, index) => (
                            <motion.div
                                key={track.$id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
                            >
                                <MusicCard track={track} />
                            </motion.div>
                        ))}
                    </div>

                    {/* Infinite scroll sentinel */}
                    <div ref={sentinelRef} className="h-10" />

                    {/* Loading more indicator */}
                    {isLoadingMore && (
                        <div className="flex justify-center py-8">
                            <div className="flex items-center gap-3 text-[#fafaf5]/50">
                                <motion.div
                                    className="w-5 h-5 border-2 border-[#c9a962] border-t-transparent rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                />
                                <span className="text-sm">Loading more...</span>
                            </div>
                        </div>
                    )}

                    {/* End of list indicator */}
                    {!hasMore && tracks.length > 0 && (
                        <motion.p
                            className="text-center text-[#fafaf5]/30 py-8 text-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            You've reached the end
                        </motion.p>
                    )}
                </>
            )}
        </div>
    );
}
