/**
 * MusicCard - Album Art as Sacred Space
 * 
 * Philosophy: The album art IS the music made visible.
 * Everything else supports it, not competes with it.
 * No overlays cluttering the art - it needs to breathe.
 */
import { useState } from 'react';
import { Play, Pause, Heart, Plus } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { getTrackCoverUrl } from '../../utils/trackUtils';
import { favoritesService } from '../../services/favorites.service';
import { useAuth } from '../../context/AuthContext';
import type { Track } from '../../types';

interface MusicCardProps {
    track: Track;
}

export function MusicCard({ track }: MusicCardProps) {
    const { currentTrack, isPlaying, play, pause, resume, addToQueue } = usePlayer();
    const { user } = useAuth();
    const [isHovered, setIsHovered] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isAddingFavorite, setIsAddingFavorite] = useState(false);

    const isCurrentTrack = currentTrack?.$id === track.$id;
    const isPlayingThis = isCurrentTrack && isPlaying;

    // Use source-aware cover URL helper
    const coverUrl = getTrackCoverUrl(track, 400, 400);

    function handlePlayClick(e: React.MouseEvent) {
        e.stopPropagation();
        if (isCurrentTrack) {
            isPlaying ? pause() : resume();
        } else {
            play(track);
        }
    }

    async function handleFavoriteClick(e: React.MouseEvent) {
        e.stopPropagation();
        if (!user || isAddingFavorite) return;

        setIsAddingFavorite(true);
        try {
            // Use toggleFavorite with correct signature: (userId, Track)
            const newState = await favoritesService.toggleFavorite(user.$id, track);
            setIsFavorite(newState);
        } catch (err) {
            console.error('Failed to toggle favorite:', err);
        } finally {
            setIsAddingFavorite(false);
        }
    }

    function handleAddToQueue(e: React.MouseEvent) {
        e.stopPropagation();
        addToQueue(track);
    }

    return (
        <div
            className="group p-5 rounded-2xl bg-[#111111] border border-white/5 cursor-pointer transition-all duration-500 hover:bg-[#151515] hover:border-[#c9a962]/20"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => play(track)}
            style={{
                boxShadow: isPlayingThis
                    ? '0 0 40px rgba(201, 169, 98, 0.15)'
                    : 'none',
                transform: isHovered ? 'translateY(-4px)' : 'none',
            }}
        >
            {/* Album Art - THE SOUL - Large and breathing */}
            <div
                className="relative aspect-square rounded-xl overflow-hidden mb-5"
                style={{
                    boxShadow: isPlayingThis
                        ? '0 8px 32px rgba(201, 169, 98, 0.2)'
                        : '0 8px 32px rgba(255, 255, 255, 0.3)',
                }}
            >
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={track.title}
                        className="w-full h-full object-cover transition-transform duration-700"
                        style={{
                            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                        }}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] flex items-center justify-center">
                        <span className="text-5xl">🎵</span>
                    </div>
                )}

                {/* Subtle dark overlay on hover - not blocking the art */}
                <div
                    className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300"
                    style={{ opacity: isHovered || isPlayingThis ? 1 : 0 }}
                />

                {/* Action Buttons Row - Appears on hover */}
                <div
                    className="absolute bottom-3 right-3 flex items-center gap-2 transition-all duration-300"
                    style={{
                        opacity: isHovered || isPlayingThis ? 1 : 0,
                        transform: isHovered || isPlayingThis ? 'translateY(0)' : 'translateY(8px)',
                    }}
                >
                    {/* Add to Queue */}
                    <button
                        onClick={handleAddToQueue}
                        className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
                        aria-label="Add to queue"
                        title="Add to queue"
                    >
                        <Plus size={16} className="text-white" />
                    </button>

                    {/* Favorite */}
                    <button
                        onClick={handleFavoriteClick}
                        className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors ${isFavorite
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>

                    {/* Play Button */}
                    <button
                        onClick={handlePlayClick}
                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                        style={{ background: '#c9a962' }}
                        aria-label={isPlayingThis ? 'Pause' : 'Play'}
                    >
                        {isPlayingThis ? (
                            <Pause size={20} fill="#0a0a0a" className="text-[#0a0a0a]" />
                        ) : (
                            <Play size={20} fill="#0a0a0a" className="text-[#0a0a0a] ml-0.5" />
                        )}
                    </button>
                </div>

                {/* Now Playing Indicator - Minimal, top left */}
                {isPlayingThis && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#c9a962]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0a0a0a] animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]">
                            Playing
                        </span>
                    </div>
                )}
            </div>

            {/* Track Info - Clear hierarchy, no clutter */}
            <div className="space-y-1.5">
                <h3
                    className="font-semibold text-base truncate transition-colors duration-300"
                    style={{ color: isCurrentTrack ? '#c9a962' : '#fafaf5' }}
                >
                    {track.title}
                </h3>
                <p className="text-sm text-[#fafaf5]/50 truncate">
                    {track.artist}
                </p>
            </div>

            {/* Genre Tag - Uses sage for secondary accent */}
            {track.genre && (
                <div className="mt-3">
                    <span className="inline-block px-2.5 py-1 text-[10px] rounded-full bg-[#4a5e4a]/20 text-[#4a5e4a] uppercase tracking-wider font-medium">
                        {track.genre}
                    </span>
                </div>
            )}
        </div>
    );
}

