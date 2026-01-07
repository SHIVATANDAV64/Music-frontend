/**
 * Podcasts Page
 * Browse podcast shows
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic2 } from 'lucide-react';
import { PodcastCard } from '../components/cards';
import { podcastService } from '../services';
import type { Podcast } from '../types';

export function Podcasts() {
    const [podcasts, setPodcasts] = useState<Podcast[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadPodcasts() {
            try {
                const data = await podcastService.getPodcasts();
                setPodcasts(data);
            } catch (error) {
                console.error('Failed to load podcasts:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadPodcasts();
    }, []);

    return (
        <div className="min-h-screen p-8 p-12-lg">
            {/* Header / Identity Card */}
            <div className="max-w-[1800px] mx-auto mb-12">
                <div className="flex items-center gap-4 mb-8">
                    <span className="font-mono text-xs text-[var(--color-accent-gold)] border border-[var(--color-accent-gold)]/50 px-2 py-1">03</span>
                    <h1 className="text-3xl font-display text-[var(--color-text-primary)] tracking-wide">
                        Broadcasts
                    </h1>
                </div>

                <div className="h-px bg-[var(--color-border)] w-full mb-8" />

                {/* Podcasts Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="aspect-[4/5] bg-[var(--color-card)] animate-pulse rounded-lg border border-[var(--color-border)]" />
                        ))}
                    </div>
                ) : podcasts.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <div className="w-16 h-16 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-4">
                            <Mic2 size={24} className="text-[var(--color-text-muted)]" />
                        </div>
                        <h3 className="text-xl font-display text-[var(--color-text-primary)] mb-2">No Signal Detected</h3>
                        <p className="font-mono text-xs text-[var(--color-text-muted)] tracking-widest uppercase">Broadcast channels are offline</p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {podcasts.map((podcast) => (
                            <PodcastCard key={podcast.$id} podcast={podcast} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
