/**
 * QueuePanel - Spotify-style Queue Display
 * 
 * Shows upcoming tracks with artwork, drag-to-reorder (future), remove
 */
import { X, GripVertical, Play } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { getTrackCoverUrl } from '../../utils/trackUtils';
import type { Track, PlayableItem } from '../../types';

interface QueuePanelProps {
    isOpen: boolean;
    onClose: () => void;
}

// Type guard
function isTrack(item: PlayableItem): item is Track {
    return 'artist' in item;
}

export function QueuePanel({ isOpen, onClose }: QueuePanelProps) {
    const { queue, currentTrack, play, isPlaying } = usePlayer();

    if (!isOpen) return null;

    // Split queue into current and upcoming
    const currentIdx = queue.findIndex(t => t.$id === currentTrack?.$id);
    const upcomingTracks = currentIdx >= 0 ? queue.slice(currentIdx + 1) : queue;

    const getCoverUrl = (item: PlayableItem) => {
        if (isTrack(item)) {
            return getTrackCoverUrl(item, 100, 100);
        }
        return null;
    };

    const getArtist = (item: PlayableItem) => {
        if (isTrack(item)) {
            return item.artist;
        }
        return 'Podcast';
    };

    return (
        <div className="fixed right-0 top-0 h-full w-80 bg-[#0a0a0a] border-l border-white/10 z-[100] flex flex-col animate-in slide-in-from-right-full duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    Queue
                </h2>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Now Playing */}
            {currentTrack && (
                <div className="p-4 border-b border-white/10">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">
                        Now Playing
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--bg-surface)]">
                            {getCoverUrl(currentTrack) ? (
                                <img
                                    src={getCoverUrl(currentTrack) || ''}
                                    alt={currentTrack.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">🎵</div>
                            )}
                            {isPlaying && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="flex gap-0.5">
                                        <div className="w-1 h-3 bg-[var(--gold)] animate-pulse" />
                                        <div className="w-1 h-4 bg-[var(--gold)] animate-pulse delay-75" />
                                        <div className="w-1 h-2 bg-[var(--gold)] animate-pulse delay-150" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-[var(--gold)] truncate">
                                {currentTrack.title}
                            </h3>
                            <p className="text-sm text-[var(--text-muted)] truncate">
                                {getArtist(currentTrack)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Upcoming */}
            <div className="flex-1 overflow-y-auto p-4">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">
                    Up Next ({upcomingTracks.length})
                </p>

                {upcomingTracks.length === 0 ? (
                    <div className="text-center py-8 text-[var(--text-muted)]">
                        <p>No upcoming tracks</p>
                        <p className="text-sm mt-1">Add songs to your queue</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {upcomingTracks.map((track, idx) => (
                            <div
                                key={`${track.$id}-${idx}`}
                                className="group flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                                onClick={() => play(track)}
                            >
                                {/* Drag handle (visual only for now) */}
                                <GripVertical size={14} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-50" />

                                {/* Album Art */}
                                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-[var(--bg-surface)]">
                                    {getCoverUrl(track) ? (
                                        <img
                                            src={getCoverUrl(track) || ''}
                                            alt={track.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">🎵</div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--gold)] transition-colors">
                                        {track.title}
                                    </h4>
                                    <p className="text-xs text-[var(--text-muted)] truncate">
                                        {getArtist(track)}
                                    </p>
                                </div>

                                {/* Remove button (Desktop) */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // TODO: Implement remove from queue
                                        console.log('Remove from queue clicked');
                                    }}
                                    className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 text-red-500 hover:bg-white/10 transition-all"
                                    title="Remove from queue"
                                >
                                    <X size={14} />
                                </button>

                                {/* Play on hover */}
                                <button className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 bg-[var(--gold)] text-black transition-opacity">
                                    <Play size={14} fill="currentColor" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
                <p className="text-xs text-[var(--text-muted)] text-center">
                    {queue.length} tracks in queue
                </p>
            </div>
        </div>
    );
}
