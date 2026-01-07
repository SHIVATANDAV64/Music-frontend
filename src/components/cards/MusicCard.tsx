/**
 * MusicCard - Album Art as Sacred Space
 * 
 * Philosophy: The album art IS the music made visible.
 * Everything else supports it, not competes with it.
 * No overlays cluttering the art - it needs to breathe.
 */
import { useState } from 'react';
import { Play, Pause, Heart, Plus, ListPlus } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { getTrackCoverUrl } from '../../utils/trackUtils';
import { favoritesService } from '../../services/favorites.service';
import { useAuth } from '../../context/AuthContext';
import { PlaylistSelector } from '../player/PlaylistSelector';
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
    const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);

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
            className="group p-4 rounded-2xl bg-secondary border border-theme cursor-pointer transition-all duration-500 hover:bg-hover hover:border-accent/20"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => play(track)}
            style={{
                transform: isHovered ? 'translateY(-4px)' : 'none',
            }}
        >
            {/* Album Art - responsive container */}
            <div className="relative aspect-square rounded-xl overflow-hidden mb-4 shadow-2xl group/art">
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={track.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] flex items-center justify-center">
                        <span className="text-4xl opacity-30">🎵</span>
                    </div>
                )}

                {/* Overlays - Improved Visibility */}
                <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 flex items-center justify-center gap-3 ${isHovered || isPlayingThis ? 'opacity-100' : 'opacity-0'}`}>
                    <button
                        onClick={handleFavoriteClick}
                        disabled={isAddingFavorite}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md border ${isFavorite
                            ? 'bg-[var(--gold)] border-[var(--gold)] text-black'
                            : 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:scale-110'
                            }`}
                        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} className={isAddingFavorite ? 'animate-pulse' : ''} />
                    </button>

                    <button
                        onClick={handlePlayClick}
                        className="w-14 h-14 rounded-full bg-[var(--gold)] text-black flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all duration-300"
                        title="Play"
                    >
                        {isPlayingThis ? (
                            <Pause size={24} fill="currentColor" />
                        ) : (
                            <Play size={24} fill="currentColor" className="ml-1" />
                        )}
                    </button>

                    <button
                        onClick={handleAddToQueue}
                        className="w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center backdrop-blur-md hover:bg-white/20 hover:scale-110 transition-all"
                        title="Add to queue"
                    >
                        <Plus size={18} />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowPlaylistSelector(true);
                        }}
                        className="w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center backdrop-blur-md hover:bg-white/20 hover:scale-110 transition-all"
                        title="Add to playlist"
                    >
                        <ListPlus size={18} />
                    </button>
                </div>

                {/* Playlist Selector Modal */}
                <PlaylistSelector
                    isOpen={showPlaylistSelector}
                    onClose={() => setShowPlaylistSelector(false)}
                    track={track}
                />

                {/* Mobile/Compact indicator for currently playing */}
                {isPlayingThis && (
                    <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[var(--gold)] flex items-center justify-center text-black shadow-lg animate-pulse md:hidden">
                        <Pause size={14} fill="currentColor" />
                    </div>
                )}
            </div>

            <div className="space-y-1 px-1">
                <h3 className={`font-bold text-base truncate transition-colors ${isCurrentTrack ? 'text-accent' : 'text-primary group-hover:text-accent'}`}>
                    {track.title}
                </h3>
                <p className="text-sm font-medium text-secondary group-hover:text-primary transition-colors truncate">
                    {track.artist}
                </p>
                {track.source === 'jamendo' && (
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-muted px-1.5 py-0.5 rounded border border-theme mt-1">
                        Jamendo
                    </span>
                )}
            </div>
        </div>
    );
}


