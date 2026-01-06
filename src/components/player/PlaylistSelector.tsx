import { useState, useEffect } from 'react';
import { X, Plus, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playlistService } from '../../services/playlist.service';
import { useAuth } from '../../context/AuthContext';
import type { Playlist, Track } from '../../types';

interface PlaylistSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    track: Track;
}

export function PlaylistSelector({ isOpen, onClose, track }: PlaylistSelectorProps) {
    const { user } = useAuth();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    async function handleAddToPlaylist(playlistId: string) {
        if (!user || isAdding) return;
        setIsAdding(true);
        try {
            await playlistService.addTrackToPlaylist(playlistId, track, user.$id);
            onClose();
            // TODO: Show success toast
        } catch (err) {
            console.error('Failed to add to playlist:', err);
            setError('Failed to add track to playlist');
        } finally {
            setIsAdding(false);
        }
    }

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#161616] border border-white/10 rounded-2xl shadow-2xl z-[160] overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                            <h2 className="text-xl font-bold text-white">Add to Playlist</h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                                    ))}
                                </div>
                            ) : error ? (
                                <div className="text-center py-8 text-red-400">
                                    {error}
                                </div>
                            ) : playlists.length === 0 ? (
                                <div className="text-center py-8 text-white/40">
                                    <Music size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>No playlists found</p>
                                    <p className="text-sm">Create one in the library to get started</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {playlists.map(playlist => (
                                        <button
                                            key={playlist.$id}
                                            disabled={isAdding}
                                            onClick={() => handleAddToPlaylist(playlist.$id)}
                                            className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group text-left"
                                        >
                                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                                                <Music size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-white truncate">
                                                    {playlist.name}
                                                </h3>
                                                <p className="text-sm text-white/40 truncate">
                                                    {playlist.tracks?.length || 0} tracks
                                                </p>
                                            </div>
                                            {isAdding && (
                                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/20 text-white/60 hover:text-white hover:bg-white/5 transition-colors uppercase text-sm font-medium tracking-wide">
                                <Plus size={18} />
                                New Playlist
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
