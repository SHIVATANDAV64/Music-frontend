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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Mic2 size={24} className="text-green-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-display font-bold">Podcasts</h1>
                    <p className="text-text-secondary">Discover shows</p>
                </div>
            </div>

            {/* Podcasts Grid */}
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
            ) : podcasts.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                >
                    <Mic2 size={48} className="mx-auto text-text-secondary/50 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No podcasts yet</h3>
                    <p className="text-text-secondary">Check back later for new shows!</p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {podcasts.map((podcast) => (
                        <PodcastCard key={podcast.$id} podcast={podcast} />
                    ))}
                </div>
            )}
        </div>
    );
}
