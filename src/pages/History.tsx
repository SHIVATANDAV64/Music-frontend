/**
 * History Page - Recently Played
 * 
 * Displays the user's listening history
 */
import { useState, useEffect } from 'react';
import { History as HistoryIcon, Clock } from 'lucide-react';
import { historyService, type RecentlyPlayedItem } from '../services/history.service';

export default function History() {
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
                    {historyItems.map((item, idx) => {
                        const isTrack = !!item.track_id;
                        const itemId = item.track_id || item.episode_id || item.$id;

                        return (
                            <div
                                key={`${item.$id}-${idx}`}
                                className="group flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all hover:bg-white/5"
                            >
                                {/* Placeholder Art */}
                                <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--bg-surface)] flex items-center justify-center">
                                    <span className="text-2xl">{isTrack ? '🎵' : '🎙️'}</span>
                                </div>

                                {/* Item Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-[var(--text-primary)] truncate">
                                        {isTrack ? 'Track' : 'Episode'}: {itemId}
                                    </h3>
                                    <p className="text-sm text-[var(--text-muted)] truncate">
                                        {item.track_source || 'Unknown source'}
                                    </p>
                                </div>

                                {/* Time */}
                                <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm">
                                    <Clock size={14} />
                                    <span>{formatTime(item.played_at)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
