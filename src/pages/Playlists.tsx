/**
 * Playlists Page - Media Archives
 * 
 * Philosophy: A structured file system for user-curated content.
 * Aesthetic: File Manager, Directory Tree, Master-Detail View.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListMusic, Plus, Trash2, FolderOpen, Disc } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { playlistService } from '../services';
import { MusicCard } from '../components/cards';
import { Button, Input } from '../components/ui';
import type { Playlist, Track } from '../types';

export function Playlists() {
    const { user, isAuthenticated } = useAuth();
    const { play } = usePlayer();

    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
    const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingTracks, setIsLoadingTracks] = useState(false);

    // Create playlist modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Load user's playlists
    useEffect(() => {
        async function loadPlaylists() {
            if (!user?.$id) {
                setIsLoading(false);
                return;
            }

            try {
                const data = await playlistService.getUserPlaylists(user.$id);
                setPlaylists(data);
            } catch (error) {
                console.error('Failed to load playlists:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadPlaylists();
    }, [user?.$id]);

    // Load tracks when playlist is selected
    useEffect(() => {
        async function loadTracks() {
            if (!selectedPlaylist) {
                setPlaylistTracks([]);
                return;
            }

            setIsLoadingTracks(true);
            try {
                const tracks = await playlistService.getPlaylistTracks(selectedPlaylist.$id);
                setPlaylistTracks(tracks);
            } catch (error) {
                console.error('Failed to load playlist tracks:', error);
            } finally {
                setIsLoadingTracks(false);
            }
        }
        loadTracks();
    }, [selectedPlaylist?.$id]);

    async function handleCreatePlaylist() {
        if (!user?.$id || !newPlaylistName.trim()) return;

        setIsCreating(true);
        try {
            const newPlaylist = await playlistService.createPlaylist(
                user.$id,
                newPlaylistName.trim()
            );
            if (newPlaylist) {
                setPlaylists((prev) => [newPlaylist, ...prev]);
                setNewPlaylistName('');
                setShowCreateModal(false);
            }
        } catch (error) {
            console.error('Failed to create playlist:', error);
        } finally {
            setIsCreating(false);
        }
    }

    async function handleDeletePlaylist(playlistId: string) {
        if (!confirm('WARNING: DELETE_OPERATION_IRREVERSIBLE. CONFIRM?')) return;

        try {
            await playlistService.deletePlaylist(playlistId);
            setPlaylists((prev) => prev.filter((p) => p.$id !== playlistId));
            if (selectedPlaylist?.$id === playlistId) {
                setSelectedPlaylist(null);
            }
        } catch (error) {
            console.error('Failed to delete playlist:', error);
        }
    }

    function handlePlayAll() {
        if (playlistTracks.length > 0) {
            play(playlistTracks[0]);
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center py-20 border border-white/5 m-8 bg-white/[0.02]">
                <ListMusic size={64} className="text-white/20 mb-4" />
                <h2 className="text-2xl font-display uppercase tracking-widest text-white mb-2">Access Denied</h2>
                <p className="font-mono text-xs text-white/50 uppercase">
                    Authentication Protocol Required for Access.
                </p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col p-6 gap-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4 min-h-[80px]">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5 flex items-center justify-center">
                        <FolderOpen size={24} className="text-[var(--color-accent-gold)]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-[var(--color-text-primary)] uppercase tracking-widest">Media Archives</h1>
                        <p className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-widest">
                            DIRECTORIES: {playlists.length} // TOTAL_SIZE: {playlists.length * 1024} KB (EST)
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-6 py-3 border border-[var(--color-accent-gold)] text-[var(--color-accent-gold)] font-mono text-xs uppercase tracking-widest hover:bg-[var(--color-accent-gold)] hover:text-[var(--color-void)] transition-all group"
                >
                    <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                    New_Directory
                </button>
            </div>

            {/* Content - Master/Detail Layout */}
            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Playlist Sidebar (Master) */}
                <div className="w-1/3 min-w-[300px] flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-2 border-b border-[var(--color-border)] pb-1">
                        Directory_Tree
                    </div>

                    {isLoading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="p-4 border border-[var(--color-border)] bg-[var(--color-card)] animate-pulse h-16" />
                        ))
                    ) : playlists.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-[var(--color-text-muted)]/20">
                            <p className="font-mono text-xs text-[var(--color-text-muted)] uppercase">No directories found</p>
                        </div>
                    ) : (
                        playlists.map((playlist) => (
                            <motion.div
                                key={playlist.$id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`p-4 border  cursor-pointer transition-all group relative ${selectedPlaylist?.$id === playlist.$id
                                    ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
                                    : 'border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-text-muted)]'
                                    }`}
                                onClick={() => setSelectedPlaylist(playlist)}
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-3">
                                        <FolderOpen size={16} className={selectedPlaylist?.$id === playlist.$id ? 'text-[var(--color-accent-gold)]' : 'text-[var(--color-text-muted)]'} />
                                        <div>
                                            <h3 className={`font-mono text-sm uppercase tracking-wide ${selectedPlaylist?.$id === playlist.$id ? 'text-[var(--color-accent-gold)]' : 'text-[var(--color-text-primary)]'}`}>{playlist.name}</h3>
                                            <p className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">{playlist.$id.substring(0, 8)}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeletePlaylist(playlist.$id);
                                        }}
                                        className="p-2 text-[var(--color-text-muted)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                {selectedPlaylist?.$id === playlist.$id && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent-gold)]/10 to-transparent pointer-events-none" />
                                )}
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Playlist Detail (Detail) */}
                <div className="flex-1 bg-[var(--color-card)] border border-[var(--color-border)] p-6 flex flex-col relative overflow-hidden">
                    {/* Tech Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(var(--color-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-border)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />

                    {selectedPlaylist ? (
                        <>
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-mono text-[var(--color-accent-gold)] uppercase tracking-widest">
                                            // SELECTED_DIRECTORY
                                        </span>
                                    </div>
                                    <h2 className="text-4xl font-display font-bold text-[var(--color-text-primary)] uppercase tracking-widest">
                                        {selectedPlaylist.name}
                                    </h2>
                                    <p className="font-mono text-xs text-[var(--color-text-muted)] mt-1 uppercase">
                                        CONTENTS: {playlistTracks.length} FILES
                                    </p>
                                </div>
                                {playlistTracks.length > 0 && (
                                    <Button
                                        onClick={handlePlayAll}
                                        variant="primary"
                                        className="px-8"
                                    >
                                        INITIATE_PLAYBACK
                                    </Button>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                                {isLoadingTracks ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {[...Array(4)].map((_, i) => (
                                            <div key={i} className="aspect-[3/4] border border-[var(--color-border)] bg-[var(--color-card)] animate-pulse" />
                                        ))}
                                    </div>
                                ) : playlistTracks.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                        <Disc size={48} className="text-[var(--color-text-muted)] mb-4 animate-spin-slow" />
                                        <p className="font-mono text-xs text-[var(--color-text-muted)] uppercase">Directory Empty</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {playlistTracks.map((track) => (
                                            <MusicCard key={track.$id} track={track} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 border border-dashed border-[var(--color-text-muted)]/20 flex items-center justify-center mb-6">
                                <ListMusic size={32} className="text-[var(--color-text-muted)]" />
                            </div>
                            <h3 className="font-display text-xl text-[var(--color-text-primary)] uppercase tracking-widest mb-2">Awaiting Selection</h3>
                            <p className="font-mono text-xs text-[var(--color-text-muted)] uppercase">
                                Select a directory from the tree to inspect contents.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Playlist Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md p-8 bg-[var(--color-card)] border border-[var(--color-border)] relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Decorative borders */}
                            <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-[var(--color-accent-gold)]" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-[var(--color-accent-gold)]" />

                            <h2 className="text-2xl font-display font-bold text-white mb-6 uppercase tracking-widest">
                                New Directory
                            </h2>

                            <div className="space-y-6">
                                <Input
                                    label="Directory Name"
                                    value={newPlaylistName}
                                    onChange={(e) => setNewPlaylistName(e.target.value)}
                                    placeholder="ENTER_NAME"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                                    className="bg-[var(--color-void)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                                />

                                <div className="flex gap-4 pt-2">
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 py-3 border border-white/10 text-white/60 font-mono text-xs uppercase tracking-widest hover:bg-white/5 hover:text-white transition-colors"
                                    >
                                        Abort
                                    </button>
                                    <Button
                                        onClick={handleCreatePlaylist}
                                        isLoading={isCreating}
                                        disabled={!newPlaylistName.trim()}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        Create
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
