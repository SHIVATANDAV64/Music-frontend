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
        <div className="space-y-12 min-h-screen bg-[var(--color-void)] selection:bg-[var(--color-accent-gold)] selection:text-black">
            {/* Grid Overlay */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none z-0" />

            {/* Header - Technical Terminal Style */}
            <div className="relative pt-10 border-b border-[var(--color-border)] pb-8 z-10">
                <div className="flex items-end gap-6">
                    <div className="hidden md:flex w-20 h-20 border border-[var(--color-border)] items-center justify-center bg-[var(--color-card)]">
                        <Music size={32} className="text-[var(--color-accent-gold)] opacity-80" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 bg-[var(--color-accent-gold)] rounded-full animate-pulse" />
                            <span className="font-mono text-[10px] text-[var(--color-accent-gold)] tracking-widest uppercase">/Root/Audio_Database</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-display text-[var(--color-text-primary)] tracking-tight leading-none">
                            Global Library
                        </h1>
                    </div>
                </div>
            </div>

            {/* Genre Filter - Terminal Tabs */}
            <div className="relative z-10">
                <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
                    {GENRES.map((genre) => {
                        const isActive = selectedGenre === genre.id;

                        return (
                            <button
                                key={genre.id}
                                onClick={() => setSelectedGenre(genre.id)}
                                className={`
                                    group relative flex items-center gap-3 px-6 py-3 text-xs font-mono uppercase tracking-widest whitespace-nowrap 
                                    transition-all duration-300 border
                                    ${isActive
                                        ? 'bg-[var(--color-accent-gold)]/10 border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]'
                                        : 'bg-transparent border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent-gold)]/50 hover:text-[var(--color-accent-gold)]'
                                    }
                                `}
                            >
                                {isActive && (
                                    <span className="absolute left-1 top-1 w-1 h-1 bg-[var(--color-accent-gold)]" />
                                )}
                                <span className={isActive ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}>
                                    {isActive ? `[ ${genre.label} ]` : genre.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tracks Grid */}
            <div className="relative z-10 min-h-[400px]">
                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-px bg-[var(--color-border)] border border-[var(--color-border)]">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="aspect-[4/5] bg-[var(--color-void)] animate-pulse" />
                        ))}
                    </div>
                ) : tracks.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-32 border border-[var(--color-border)] bg-[var(--color-card)]"
                    >
                        <div className="w-16 h-16 border border-[var(--color-border)] flex items-center justify-center mb-6 text-[var(--color-text-muted)]">
                            <Sparkles size={24} />
                        </div>
                        <h3 className="text-xl font-display text-[var(--color-text-primary)] mb-2">No Signal Detected</h3>
                        <p className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-widest">
                            {selectedGenre === 'All'
                                ? "Database empty. Initiate upload."
                                : `Sector ${selectedGenre} returned 0 results.`}
                        </p>
                    </motion.div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {tracks.map((track, index) => (
                                <motion.div
                                    key={track.$id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                                >
                                    <MusicCard track={track} />
                                </motion.div>
                            ))}
                        </div>

                        {/* Infinite scroll sentinel */}
                        <div ref={sentinelRef} className="h-10" />

                        {/* Loading more indicator */}
                        {isLoadingMore && (
                            <div className="flex justify-center py-12 border-t border-[var(--color-border)] mt-8">
                                <div className="flex items-center gap-4 text-[var(--color-accent-gold)]">
                                    <span className="w-2 h-2 bg-[var(--color-accent-gold)] animate-ping" />
                                    <span className="font-mono text-xs uppercase tracking-widest">Fetching Data Packets...</span>
                                </div>
                            </div>
                        )}

                        {/* End of list indicator */}
                        {!hasMore && tracks.length > 0 && (
                            <div className="flex justify-center py-12 border-t border-[var(--color-border)] mt-8">
                                <p className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em]">
                                    // END OF DATABASE //
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
