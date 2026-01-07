/**
 * Search Page - Query Console
 * 
 * Philosophy: Database Interrogation.
 * Technical interface for retrieving audio packets.
 */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Music, Mic2, Command } from 'lucide-react';
import { MusicCard, PodcastCard } from '../components/cards';
import { musicService, podcastService } from '../services';
import type { Track, Podcast } from '../types';

export function Search() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const [tracks, setTracks] = useState<Track[]>([]);
    const [podcasts, setPodcasts] = useState<Podcast[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'music' | 'podcasts'>('all');

    useEffect(() => {
        if (!query) {
            setTracks([]);
            setPodcasts([]);
            return;
        }

        async function performSearch() {
            setIsLoading(true);
            try {
                const [trackResults, podcastResults] = await Promise.all([
                    musicService.getTracks({ search: query }),
                    podcastService.getPodcasts(),
                ]);
                // Safely handle results
                setTracks(Array.isArray(trackResults) ? trackResults : []);

                // Podcasts might be nested in { data: [] } or just be the array itself
                const rawPodcasts = (podcastResults as any)?.data || podcastResults;
                const podcastArray = Array.isArray(rawPodcasts) ? rawPodcasts : [];

                setPodcasts(podcastArray.filter((p: any) =>
                    p && p.title?.toLowerCase().includes(query.toLowerCase()) ||
                    p.author?.toLowerCase().includes(query.toLowerCase())
                ));
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setIsLoading(false);
            }
        }
        performSearch();
    }, [query]);

    const hasResults = tracks.length > 0 || podcasts.length > 0;

    return (
        <div className="space-y-8 p-8">
            {/* Header / Query Status */}
            <div className="border-b border-[var(--color-border)] pb-8">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 border border-[var(--color-accent-gold)] flex items-center justify-center bg-[var(--color-accent-gold)]/5">
                        <SearchIcon size={24} className="text-[var(--color-accent-gold)]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display uppercase tracking-widest text-[var(--color-text-primary)]">Query Console</h1>
                        <div className="flex items-center gap-2 font-mono text-xs text-[var(--color-accent-gold)]">
                            <span className="w-2 h-2 bg-[var(--color-accent-gold)] rounded-full animate-pulse" />
                            <span>STATUS: {isLoading ? 'SCANNING_DATABASE...' : 'READY'}</span>
                        </div>
                    </div>
                </div>

                {query && (
                    <div className="mt-4 px-4 py-2 border-l-2 border-[var(--color-accent-gold)] bg-[var(--color-card)] font-mono text-xs text-[var(--color-text-muted)]">
                        SEARCH_PACKET: "<span className="text-[var(--color-text-primary)]">{query}</span>"
                        {hasResults && <span className="ml-2 text-[var(--color-accent-gold)]">// {tracks.length + podcasts.length} MATCHES FOUND</span>}
                    </div>
                )}
            </div>

            {!query ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10"
                >
                    <Command size={48} className="text-white/10 mb-6" />
                    <h3 className="text-xl font-display text-white/40 mb-2">AWAITING INPUT</h3>
                    <p className="font-mono text-xs text-white/20 uppercase tracking-widest">Enter search parameters to initialize database scan</p>
                </motion.div>
            ) : isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="aspect-[3/4] border border-[var(--color-border)] bg-[var(--color-card)] animate-pulse relative">
                            <div className="absolute top-2 right-2 w-4 h-4 border border-[var(--color-border)]" />
                        </div>
                    ))}
                </div>
            ) : !hasResults ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20 border border-[var(--color-border)] bg-red-500/[0.02]"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 border border-red-500/30 rounded-none mb-6 text-red-500/50">
                        <SearchIcon size={32} />
                    </div>
                    <h3 className="text-xl font-display text-[var(--color-text-primary)] mb-2">NO DATA FOUND</h3>
                    <p className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-widest">
                        Query returned 0 results. Refine parameters.
                    </p>
                </motion.div>
            ) : (
                <>
                    {/* Filter Tabs - Terminal Style */}
                    <div className="flex gap-px bg-[var(--color-border)] border border-[var(--color-border)] w-fit">
                        {['all', 'music', 'podcasts'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as typeof activeTab)}
                                className={`px-6 py-2 text-[10px] font-mono uppercase tracking-widest transition-all ${activeTab === tab
                                    ? 'bg-[var(--color-accent-gold)] text-[var(--color-accent-primary)] font-bold'
                                    : 'bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card-hover)]'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Results Grid */}
                    <div className="space-y-12">
                        {(activeTab === 'all' || activeTab === 'music') && tracks.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-2">
                                    <Music size={16} className="text-[#D4AF37]" />
                                    <h2 className="font-display text-white tracking-widest">AUDIO_TRACKS</h2>
                                    <span className="font-mono text-[10px] text-white/20 ml-auto">count: {tracks.length}</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-px bg-white/5 border border-white/5">
                                    {tracks.map((track) => (
                                        <div key={track.$id} className="bg-[var(--color-void)]">
                                            <MusicCard track={track} />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {(activeTab === 'all' || activeTab === 'podcasts') && podcasts.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-6 border-b border-[var(--color-border)] pb-2">
                                    <Mic2 size={16} className="text-[var(--color-accent-gold)]" />
                                    <h2 className="font-display text-[var(--color-text-primary)] tracking-widest">BROADCASTS</h2>
                                    <span className="font-mono text-[10px] text-[var(--color-text-muted)] ml-auto">count: {podcasts.length}</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-px bg-[var(--color-border)] border border-[var(--color-border)]">
                                    {podcasts.map((podcast) => (
                                        <div key={podcast.$id} className="bg-[#050505]">
                                            <PodcastCard podcast={podcast} />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
