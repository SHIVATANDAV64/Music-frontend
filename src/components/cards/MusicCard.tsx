/**
 * MusicCard - Album Art as Sacred Space
 * 
 * Philosophy: The album art IS the music made visible.
 * Everything else supports it, not competes with it.
 * No overlays cluttering the art - it needs to breathe.
 */
import { useState, useEffect } from 'react';
import { Play, Pause, Heart, Plus, ListPlus } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { getTrackCoverUrl } from '../../utils/trackUtils';
import { favoritesService } from '../../services/favorites.service';
import { useAuth } from '../../context/AuthContext';
import { PlaylistSelector } from '../player/PlaylistSelector';
import type { Track } from '../../types';

interface MusicCardProps {
    track: Track;
    onUnfavorite?: (trackId: string) => void;
    onPlaylistUpdate?: (playlistId: string, trackId: string, action: 'add' | 'remove') => void;
}

export function MusicCard({ track, onUnfavorite, onPlaylistUpdate }: MusicCardProps) {
    const { currentTrack, isPlaying, play, pause, resume, addToQueue } = usePlayer();
    const { user } = useAuth();
    const [isHovered, setIsHovered] = useState(false);
    const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isAddingFavorite, setIsAddingFavorite] = useState(false);

    useEffect(() => {
        if (user?.$id) {
            favoritesService.isFavorite(user.$id, track.$id)
                .then(setIsFavorite)
                .catch(err => console.error('[MusicCard] check favorite fail:', err));
        }
    }, [user?.$id, track.$id, user]);

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
            // Use toggleFavorite with correct signature: (Track)
            const newState = await favoritesService.toggleFavorite(track);
            setIsFavorite(newState);
            if (!newState && onUnfavorite) {
                onUnfavorite(track.$id);
            }
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
            className="group relative p-3 rounded-none border border-[var(--color-border)] bg-[var(--color-glass)] backdrop-blur-sm cursor-pointer transition-all duration-300 hover:border-[var(--color-accent-gold)]/50 hover:shadow-[0_0_20px_rgba(212,175,55,0.1)]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => play(track)}
        >
            {/* Hover Scanline Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-accent-gold)]/5 to-transparent opacity-0 group-hover:opacity-100 translate-y-[-100%] group-hover:translate-y-[100%] transition-all duration-1000 pointer-events-none z-0" />

            {/* Album Art - Tech container */}
            <div className="relative aspect-square overflow-hidden mb-3 border border-[var(--color-border)] group-hover:border-[var(--color-accent-gold)]/30 transition-colors z-10">
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={track.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full bg-[var(--color-card)] flex items-center justify-center">
                        <span className="text-2xl opacity-20 font-mono tracking-widest text-[var(--color-text-muted)]">NULL</span>
                    </div>
                )}

                {/* Overlays - Precision Controls */}
                <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center gap-2 ${isHovered || isPlayingThis ? 'opacity-100' : 'opacity-0'}`}>
                    <button
                        onClick={handleFavoriteClick}
                        disabled={isAddingFavorite}
                        className={`w-8 h-8 flex items-center justify-center transition-colors border ${isFavorite
                            ? 'bg-[var(--color-accent-gold)] border-[var(--color-accent-gold)] text-[var(--color-accent-primary)]'
                            : 'bg-transparent border-[var(--color-border)] text-white hover:border-[var(--color-accent-gold)] hover:text-[var(--color-accent-gold)]'
                            }`}
                        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} className={isAddingFavorite ? 'animate-pulse' : ''} />
                    </button>

                    <button
                        onClick={handlePlayClick}
                        className="w-12 h-12 border border-[var(--color-accent-gold)] text-[var(--color-accent-gold)] flex items-center justify-center hover:bg-[var(--color-accent-gold)] hover:text-[var(--color-accent-primary)] transition-all duration-300"
                        title="Play"
                    >
                        {isPlayingThis ? (
                            <Pause size={20} fill="currentColor" />
                        ) : (
                            <Play size={20} fill="currentColor" className="ml-1" />
                        )}
                    </button>

                    <button
                        onClick={handleAddToQueue}
                        className="w-8 h-8 border border-[var(--color-border)] text-white flex items-center justify-center hover:border-[var(--color-accent-gold)] hover:text-[var(--color-accent-gold)] transition-colors"
                        title="Add to queue"
                    >
                        <Plus size={16} />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowPlaylistSelector(true);
                        }}
                        className="w-8 h-8 border border-[var(--color-border)] text-white flex items-center justify-center hover:border-[var(--color-accent-gold)] hover:text-[var(--color-accent-gold)] transition-colors"
                        title="Add to playlist"
                    >
                        <ListPlus size={16} />
                    </button>
                </div>

                {/* Playlist Selector Modal */}
                <PlaylistSelector
                    isOpen={showPlaylistSelector}
                    onClose={() => setShowPlaylistSelector(false)}
                    track={track}
                    onUpdate={onPlaylistUpdate}
                />

                {/* Mobile/Compact indicator for currently playing */}
                {isPlayingThis && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-[var(--color-accent-gold)] flex items-center justify-center text-[var(--color-accent-primary)] animate-pulse md:hidden">
                        <Pause size={12} fill="currentColor" />
                    </div>
                )}
            </div>

            <div className="space-y-1 relative z-10">
                <h3 className={`font-display font-medium text-sm truncate tracking-wide transition-colors ${isCurrentTrack ? 'text-[var(--color-accent-gold)]' : 'text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-gold)]'}`}>
                    {track.title}
                </h3>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transition-colors truncate">
                    {track.artist}
                </p>
                {track.source === 'jamendo' && (
                    <div className="flex items-center gap-1 mt-1">
                        <span className="w-1 h-1 bg-[var(--color-accent-gold)] rounded-full"></span>
                        <span className="font-mono text-[8px] text-[var(--color-accent-gold)]/60 uppercase tracking-widest">
                            EXT_SRC
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}


