/**
 * Music Page
 * Browse and filter music tracks with Spotify-like queue management
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music, Filter } from 'lucide-react';
import { MusicCard } from '../components/cards';
import { musicService } from '../services';
import { usePlayer } from '../context/PlayerContext';
import type { Track } from '../types';

const GENRES = ['All', 'Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Classical', 'Jazz', 'R&B'];

export function MusicPage() {
    const { setQueue } = usePlayer();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [selectedGenre, setSelectedGenre] = useState('All');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadTracks() {
            setIsLoading(true);
            try {
                const data = await musicService.getTracks({
                    genre: selectedGenre === 'All' ? undefined : selectedGenre,
                });
                setTracks(data);

                // Set queue for Spotify-like navigation - enables next/previous to work
                if (data.length > 0) {
                    setQueue(data);
                }
            } catch (error) {
                console.error('Failed to load tracks:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadTracks();
    }, [selectedGenre, setQueue]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[var(--gold-muted)] flex items-center justify-center">
                        <Music size={24} className="text-[var(--gold)]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">Music</h1>
                        <p className="text-[var(--text-secondary)]">Browse all tracks</p>
                    </div>
                </div>
            </div>

            {/* Genre Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Filter size={18} className="text-[var(--text-secondary)] flex-shrink-0" />
                {GENRES.map((genre) => (
                    <button
                        key={genre}
                        onClick={() => setSelectedGenre(genre)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedGenre === genre
                                ? 'bg-[var(--gold)] text-[var(--bg-deep)]'
                                : 'glass text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10'
                            }`}
                    >
                        {genre}
                    </button>
                ))}
            </div>

            {/* Tracks Grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="p-4 rounded-xl glass">
                            <div className="aspect-square rounded-lg skeleton mb-4" />
                            <div className="h-4 rounded skeleton mb-2" />
                            <div className="h-3 rounded skeleton w-2/3" />
                        </div>
                    ))}
                </div>
            ) : tracks.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                >
                    <Music size={48} className="mx-auto text-[var(--text-secondary)]/50 mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">No tracks found</h3>
                    <p className="text-[var(--text-secondary)]">
                        {selectedGenre === 'All'
                            ? "There are no tracks yet. Check back later!"
                            : `No tracks in ${selectedGenre} category.`}
                    </p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {tracks.map((track) => (
                        <MusicCard key={track.$id} track={track} />
                    ))}
                </div>
            )}
        </div>
    );
}
