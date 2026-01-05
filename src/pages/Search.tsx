/**
 * Search Page
 * Search across tracks and podcasts
 */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Music, Mic2 } from 'lucide-react';
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                    <SearchIcon size={24} className="text-accent" />
                </div>
                <div>
                    <h1 className="text-3xl font-display font-bold">Search</h1>
                    {query && (
                        <p className="text-text-secondary">
                            Results for "{query}"
                        </p>
                    )}
                </div>
            </div>

            {!query ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                >
                    <SearchIcon size={48} className="mx-auto text-text-secondary/50 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Search for music & podcasts</h3>
                    <p className="text-text-secondary">Use the search bar above to find tracks and shows</p>
                </motion.div>
            ) : isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="p-4 rounded-lg bg-[var(--bg-card)]">
                            <div className="aspect-square rounded-md skeleton mb-4" />
                            <div className="h-4 rounded skeleton mb-2" />
                            <div className="h-3 rounded skeleton w-2/3" />
                        </div>
                    ))}
                </div>
            ) : !hasResults ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                >
                    <SearchIcon size={48} className="mx-auto text-text-secondary/50 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No results found</h3>
                    <p className="text-text-secondary">Try searching for something else</p>
                </motion.div>
            ) : (
                <>
                    {/* Tabs */}
                    <div className="flex gap-2">
                        {['all', 'music', 'podcasts'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as typeof activeTab)}
                                className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${activeTab === tab
                                    ? 'bg-accent text-white'
                                    : 'glass text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Results */}
                    {(activeTab === 'all' || activeTab === 'music') && tracks.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Music size={20} className="text-accent" />
                                <h2 className="text-xl font-semibold">Tracks</h2>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {tracks.map((track) => (
                                    <MusicCard key={track.$id} track={track} />
                                ))}
                            </div>
                        </section>
                    )}

                    {(activeTab === 'all' || activeTab === 'podcasts') && podcasts.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Mic2 size={20} className="text-green-400" />
                                <h2 className="text-xl font-semibold">Podcasts</h2>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {podcasts.map((podcast) => (
                                    <PodcastCard key={podcast.$id} podcast={podcast} />
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
