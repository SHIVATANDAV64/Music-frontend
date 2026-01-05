/**
 * Podcast Card Component
 * Displays podcast show with cover and episode count
 */
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { storage, BUCKETS } from '../../lib/appwrite';
import type { Podcast } from '../../types';

interface PodcastCardProps {
    podcast: Podcast;
    index?: number;
}

export function PodcastCard({ podcast, index = 0 }: PodcastCardProps) {
    const coverUrl = podcast.cover_image_id
        ? storage.getFilePreview(BUCKETS.COVERS, podcast.cover_image_id, 300, 300).toString()
        : null;

    return (
        <Link to={`/podcasts/${podcast.$id}`}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group p-4 rounded-xl glass hover:bg-white/10 transition-all duration-300"
            >
                {/* Cover Art */}
                <div className="relative aspect-square rounded-lg overflow-hidden mb-4 bg-bg-secondary">
                    {coverUrl ? (
                        <img
                            src={coverUrl}
                            alt={podcast.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-500/20 to-teal-500/20">
                            <span className="text-4xl">🎙️</span>
                        </div>
                    )}
                </div>

                {/* Podcast Info */}
                <h3 className="font-medium truncate mb-1">{podcast.title}</h3>
                <p className="text-sm text-text-secondary truncate">{podcast.author}</p>
                {podcast.category && (
                    <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-accent/20 text-accent">
                        {podcast.category}
                    </span>
                )}
            </motion.div>
        </Link>
    );
}
