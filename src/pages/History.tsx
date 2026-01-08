/**
 * History Page - Temporal Log
 * 
 * Philosophy: A chronological record of audio interactions.
 * Aesthetic: Data stream, timestamped entries, terminal vibe.
 */
import { useState, useEffect } from 'react';
import { History as HistoryIcon, Clock, Activity, FileAudio } from 'lucide-react';
import { historyService, type RecentlyPlayedItem } from '../services/history.service';
import { usePlayer } from '../context/PlayerContext';
import { getTrackCoverUrl } from '../utils/trackUtils';
import { musicService } from '../services/musicService';

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
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="font-mono text-xs text-[var(--color-accent-gold)] animate-pulse">
                    SYNCING_TEMPORAL_DATA...
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-8">
            {/* Header */}
            <div className="border-b border-[var(--color-border)] pb-6 flex items-end justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border border-[var(--color-border)] bg-[var(--color-card)] flex items-center justify-center text-[var(--color-text-muted)]">
                        <HistoryIcon size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono text-[var(--color-accent-gold)] uppercase tracking-widest">
                                    // LOGS
                            </span>
                        </div>
                        <h1 className="text-3xl font-display font-bold text-[var(--color-text-primary)] uppercase tracking-widest leading-none">
                            Temporal Log
                        </h1>
                    </div>
                </div>
                <p className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-wider text-right">
                    ENTRIES_FOUND: <span className="text-[var(--color-accent-gold)]">{historyItems.length}</span>
                </p>
            </div>

            {/* History List */}
            {historyItems.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-[var(--color-border)] bg-[var(--color-card)]">
                    <div className="inline-flex p-4 border border-[var(--color-border)] bg-[var(--color-void)] mb-4">
                        <Activity size={32} className="text-[var(--color-text-muted)]" />
                    </div>
                    <h3 className="font-display text-lg text-[var(--color-text-primary)] mb-2 uppercase tracking-widest">
                        Log Empty
                    </h3>
                    <p className="font-mono text-xs text-[var(--color-text-muted)] uppercase">
                        No audio interaction data recorded.
                    </p>
                </div>
            ) : (
                <div className="border border-[var(--color-border)] bg-[var(--color-card)] divide-y divide-[var(--color-border)]">
                    {Array.isArray(historyItems) && historyItems.map((item: any, idx) => {
                        const track = item.track;
                        const isTrack = !!track || !!item.track_id;
                        const displayTitle = track?.title || (item.track_id ? `Track ${item.track_id}` : `Episode ${item.episode_id}`);
                        const displayArtist = track?.artist || 'Unknown Artist';

                        return (
                            <div
                                key={`${item.$id}-${idx}`}
                                onClick={async () => {
                                    if (track) {
                                        play(track);
                                    } else if (item.track_id) {
                                        const fullTrack = await musicService.getTrack(item.track_id);
                                        if (fullTrack) play(fullTrack);
                                    }
                                }}
                                className="group flex items-center gap-6 p-4 hover:bg-[var(--color-accent-gold)]/5 cursor-pointer transition-colors relative overflow-hidden"
                            >
                                {/* Active Indicator line */}
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--color-accent-gold)] opacity-0 group-hover:opacity-100 transition-opacity" />

                                {/* Art */}
                                <div className="relative w-12 h-12 border border-[var(--color-border)] flex-shrink-0 bg-[var(--color-void)] overflow-hidden">
                                    {track && getTrackCoverUrl(track, 120, 120) ? (
                                        <img
                                            src={getTrackCoverUrl(track, 120, 120)!}
                                            alt=""
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 grayscale group-hover:grayscale-0"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)]">
                                            {isTrack ? <FileAudio size={16} /> : <Activity size={16} />}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-mono text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-gold)] transition-colors truncate uppercase tracking-wide">
                                        {displayTitle}
                                    </h3>
                                    <p className="font-mono text-[10px] text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transition-colors truncate mt-1 uppercase">
                                        {displayArtist}
                                        {item.track_source && <span className="ml-2 px-1 border border-[var(--color-border)] text-[9px]">{item.track_source}</span>}
                                    </p>
                                </div>

                                {/* Time */}
                                <div className="flex flex-col items-end gap-1 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-gold)]/60 transition-colors text-[10px] font-mono uppercase">
                                    <div className="flex items-center gap-2">
                                        <span>{formatTime(item.played_at)}</span>
                                        <Clock size={10} />
                                    </div>
                                    {item.last_position > 0 && (
                                        <span className="opacity-50">RESUME @ {Math.floor(item.last_position / 60)}:{(item.last_position % 60).toString().padStart(2, '0')}</span>
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
