import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Music, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playlistService } from '../../services/playlist.service';
import { useAuth } from '../../context/AuthContext';
import type { Playlist, Track } from '../../types';

interface PlaylistSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    track: Track;
    onUpdate?: (playlistId: string, trackId: string, action: 'add' | 'remove') => void;
}

export function PlaylistSelector({ isOpen, onClose, track, onUpdate }: PlaylistSelectorProps) {
    const { user } = useAuth();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        if (isOpen && user) {
            loadPlaylists();
        }
    }, [isOpen, user]);

    async function loadPlaylists() {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await playlistService.getUserPlaylists(user.$id);
            setPlaylists(data);
        } catch (err) {
            console.error('Failed to load playlists:', err);
            setError('Failed to load playlists');
        } finally {
            setIsLoading(false);
        }
    }

    async function handleTogglePlaylist(playlist: Playlist) {
        if (!user || isAdding) return;
        setIsAdding(true);
        try {
            const isTrackInPlaylist = playlist.tracks?.some(t => t.$id === track.$id);

            if (isTrackInPlaylist) {
                await playlistService.removeTrackFromPlaylist(playlist.$id, track.$id);
                if (onUpdate) onUpdate(playlist.$id, track.$id, 'remove');
                // Update local state to reflect removal
                setPlaylists(prev => prev.map(p =>
                    p.$id === playlist.$id
                        ? { ...p, tracks: p.tracks?.filter(t => t.$id !== track.$id) }
                        : p
                ));
            } else {
                await playlistService.addTrackToPlaylist(playlist.$id, track, user.$id);
                if (onUpdate) onUpdate(playlist.$id, track.$id, 'add');
                // Update local state to reflect addition
                setPlaylists(prev => prev.map(p =>
                    p.$id === playlist.$id
                        ? { ...p, tracks: [...(p.tracks || []), track] }
                        : p
                ));
            }
        } catch (err) {
            console.error('Failed to toggle playlist membership:', err);
            setError('Failed to update playlist');
        } finally {
            setIsAdding(false);
        }
    }

    async function handleCreatePlaylist() {
        if (!user || !newName.trim() || isAdding) return;
        setIsAdding(true);
        try {
            const newPlaylist = await playlistService.createPlaylist(user.$id, newName.trim());
            if (newPlaylist) {
                setPlaylists(prev => [newPlaylist, ...prev]);
                setNewName('');
                setShowCreate(false);
                await handleTogglePlaylist(newPlaylist);
            }
        } catch (err) {
            console.error('Failed to create playlist:', err);
            setError('Failed to create playlist');
        } finally {
            setIsAdding(false);
        }
    }

    if (!isOpen) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 10 }}
                        className="relative w-[90%] max-w-sm bg-[var(--color-card)] border border-[var(--color-border)] rounded-sm shadow-2xl overflow-hidden pointer-events-auto"
                        style={{ backgroundColor: 'var(--color-card)' }}
                    >
                        {/* Technical Accent Decorators */}
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[var(--color-accent-gold)]/40" />
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[var(--color-accent-gold)]/40" />

                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-void)]/20">
                            <div>
                                <h2 className="font-display text-sm text-[var(--color-text-primary)] uppercase tracking-[0.1em] font-bold">
                                    Link Media Archive
                                </h2>
                                <p className="font-mono text-[8px] text-[var(--color-text-muted)] uppercase tracking-widest mt-0.5">
                                    Add to Collection: {track.title.length > 20 ? track.title.substring(0, 20) + '...' : track.title}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-4 max-h-[50vh] overflow-y-auto scrollbar-hide">
                            {isLoading ? (
                                <div className="space-y-2 p-1">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-12 bg-[var(--color-void)] border border-[var(--color-border)] opacity-20 animate-pulse rounded-sm" />
                                    ))}
                                </div>
                            ) : error ? (
                                <div className="text-center py-8 font-mono text-[10px] text-red-500 border border-red-500/10 bg-red-500/5 mx-2 my-2">
                                    {error}
                                </div>
                            ) : playlists.length === 0 ? (
                                <div className="text-center py-12 opacity-30 border border-dashed border-[var(--color-border)] mx-1">
                                    <Music size={32} className="mx-auto mb-4" />
                                    <p className="font-mono text-[10px] uppercase tracking-widest">Awaiting Archive Creation</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {playlists.map(playlist => {
                                        const isTrackInPlaylist = playlist.tracks?.some(t => t.$id === track.$id);
                                        return (
                                            <button
                                                key={playlist.$id}
                                                disabled={isAdding}
                                                onClick={() => handleTogglePlaylist(playlist)}
                                                className={`w-full flex items-center gap-4 px-4 py-3 border border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-void)] transition-all group relative text-left ${isTrackInPlaylist ? 'bg-[var(--color-accent-gold)]/5 border-[var(--color-accent-gold)]/20' : ''}`}
                                            >
                                                <div className={`w-10 h-10 border border-[var(--color-border)] bg-[var(--color-void)] flex items-center justify-center transition-colors ${isTrackInPlaylist ? 'text-[var(--color-accent-gold)] border-[var(--color-accent-gold)]/50' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-gold)]'}`}>
                                                    <Music size={14} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={`font-display text-xs transition-colors truncate-none break-words ${isTrackInPlaylist ? 'text-[var(--color-accent-gold)]' : 'text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-gold)]'}`}>
                                                        {playlist.name}
                                                    </h3>
                                                    <p className="font-mono text-[9px] text-[var(--color-text-muted)] uppercase mt-1 tracking-tight">
                                                        {playlist.tracks?.length || 0} SECTORS INDEXED
                                                    </p>
                                                </div>
                                                <div className="flex items-center">
                                                    {isAdding ? (
                                                        <div className="w-4 h-4 border border-[var(--color-accent-gold)] border-t-transparent rounded-full animate-spin" />
                                                    ) : isTrackInPlaylist ? (
                                                        <Check size={14} className="text-[var(--color-accent-gold)] animate-in zoom-in duration-300" />
                                                    ) : (
                                                        <Plus size={12} className="opacity-0 group-hover:opacity-100 text-[var(--color-accent-gold)] translate-x-1 group-hover:translate-x-0 transition-all duration-300" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-[var(--color-void)]/40 border-t border-[var(--color-border)]">
                            <AnimatePresence mode="wait">
                                {!showCreate ? (
                                    <motion.button
                                        key="btn"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setShowCreate(true)}
                                        className="group w-full flex items-center justify-center gap-2 py-3 border border-[var(--color-border)] hover:border-[var(--color-accent-gold)] text-[var(--color-text-primary)] transition-all duration-300"
                                    >
                                        <Plus size={16} className="text-[var(--color-accent-gold)]" />
                                        <span className="font-mono text-[10px] tracking-[0.2em] uppercase">
                                            Initialize New Archive
                                        </span>
                                    </motion.button>
                                ) : (
                                    <motion.div
                                        key="input"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="space-y-3"
                                    >
                                        <input
                                            autoFocus
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="ENTER_FILENAME_OR_ARCHIVE_ID..."
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                                            className="w-full bg-[var(--color-void)] border border-[var(--color-border)] px-4 py-3 font-mono text-[10px] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-gold)] placeholder:text-[var(--color-text-muted)]/40"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowCreate(false)}
                                                className="flex-1 py-2.5 border border-[var(--color-border)] text-[var(--color-text-muted)] font-mono text-[9px] uppercase tracking-widest hover:bg-[var(--color-void)] transition-all"
                                            >
                                                Abort
                                            </button>
                                            <button
                                                onClick={handleCreatePlaylist}
                                                disabled={isAdding || !newName.trim()}
                                                className="flex-1 py-2.5 bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)] text-[var(--color-accent-gold)] font-mono text-[9px] uppercase tracking-widest hover:bg-[var(--color-accent-gold)] hover:text-[var(--color-void)] transition-all"
                                            >
                                                Confirm_Init
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
