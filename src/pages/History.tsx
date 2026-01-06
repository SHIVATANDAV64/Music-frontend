/**
 * History Page - Recently Played
 * 
 * Displays the user's listening history
 */
import { useState, useEffect } from 'react';
import { History as HistoryIcon, Clock } from 'lucide-react';
import { historyService, type RecentlyPlayedItem } from '../services/history.service';
import { usePlayer } from '../context/PlayerContext';
import { getTrackCoverUrl } from '../utils/trackUtils';

export default function History() {
    const { play } = usePlayer();
    const [historyItems, setHistoryItems] = useState<RecentlyPlayedItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadHistory() {
            try {
                const history = await historyService.getRecentlyPlayed(50);
                setHistoryItems(history);
            } catch (err) {
                console.error('Failed to load history:', err);
            } finally {
                setIsLoading(false);
            }
        }
        loadHistory();
    }, []);

    // Format relative time
    function formatTime(dateStr: string): string {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (mins < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dim)] flex items-center justify-center">
                    <HistoryIcon size={28} className="text-black" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                        Recently Played
                    </h1>
                    <p className="text-[var(--text-muted)]">
                        {historyItems.length} items
                    </p>
                </div>
            </div>

            {/* History List */}
            {historyItems.length === 0 ? (
                <div className="text-center py-16">
                    <HistoryIcon size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
                    <h3 className="text-lg font-medium text-[var(--text-secondary)]">
                        No listening history yet
                    </h3>
                    <p className="text-[var(--text-muted)]">
                        Start playing some music!
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {Array.isArray(historyItems) && historyItems.map((item: any, idx) => {
                        const track = item.track;
                        const isTrack = !!track || !!item.track_id;
                        const displayTitle = track?.title || (item.track_id ? `Track ${item.track_id}` : `Episode ${item.episode_id}`);
                        const displayArtist = track?.artist || 'Unknown Artist';

                        return (
                            <div
                                key={`${item.$id}-${idx}`}
                                onClick={() => track && play(track)}
                                className="group flex items-center gap-6 p-4 rounded-2xl cursor-pointer transition-all hover:bg-white/10 active:scale-[0.98] border border-transparent hover:border-white/10"
                            >
                                {/* Art */}
                                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white/5 shadow-xl">
                                    {track ? (
                                        <img
                                            src={getTrackCoverUrl(track, 120, 120) || ''}
                                            alt=""
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/20 bg-white/5">
                                            {isTrack ? '🎵' : '🎙️'}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="w-8 h-8 rounded-full bg-[var(--gold)] flex items-center justify-center text-black">
                                            <HistoryIcon size={16} />
                                        </div>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-lg text-white group-hover:text-[var(--gold)] transition-colors truncate">
                                        {displayTitle}
                                    </h3>
                                    <p className="text-sm text-white/50 group-hover:text-white/70 transition-colors truncate mt-1">
                                        {displayArtist}
                                        {item.track_source && ` • ${item.track_source}`}
                                    </p>
                                </div>

                                {/* Time */}
                                <div className="flex flex-col items-end gap-1 text-white/40 group-hover:text-white/60 transition-colors text-xs font-medium">
                                    <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                                        <Clock size={12} />
                                        <span>{formatTime(item.played_at)}</span>
                                    </div>
                                    {item.last_position > 0 && (
                                        <span className="pr-1 italic">Last at {Math.floor(item.last_position / 60)}:{(item.last_position % 60).toString().padStart(2, '0')}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
