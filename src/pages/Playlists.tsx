/**
 * Playlists Page
 * View and manage user playlists
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListMusic, Plus, Trash2, Play, Music } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { playlistService } from '../services';
import { MusicCard } from '../components/cards';
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
        if (!confirm('Are you sure you want to delete this playlist?')) return;

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
            <div className="flex flex-col items-center justify-center py-20">
                <ListMusic size={64} className="text-text-secondary/50 mb-4" />
                <h2 className="text-2xl font-display font-semibold mb-2">Login Required</h2>
                <p className="text-text-secondary">
                    Please login to create and manage your playlists.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <ListMusic size={24} className="text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-bold">Your Playlists</h1>
                        <p className="text-text-secondary">
                            {playlists.length} playlist{playlists.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-accent rounded-full font-medium hover:bg-accent/90 transition-colors"
                >
                    <Plus size={18} />
                    New Playlist
                </button>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Playlists List */}
                <div className="space-y-3">
                    {isLoading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="p-4 rounded-xl glass">
                                <div className="h-5 rounded skeleton w-3/4 mb-2" />
                                <div className="h-4 rounded skeleton w-1/2" />
                            </div>
                        ))
                    ) : playlists.length === 0 ? (
                        <div className="text-center py-8 glass rounded-xl">
                            <ListMusic size={32} className="mx-auto text-text-secondary/50 mb-2" />
                            <p className="text-text-secondary">No playlists yet</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="mt-3 text-accent text-sm hover:underline"
                            >
                                Create your first playlist
                            </button>
                        </div>
                    ) : (
                        playlists.map((playlist) => (
                            <motion.div
                                key={playlist.$id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-xl glass cursor-pointer transition-all group ${selectedPlaylist?.$id === playlist.$id
                                    ? 'ring-2 ring-accent bg-accent/10'
                                    : 'hover:bg-white/5'
                                    }`}
                                onClick={() => setSelectedPlaylist(playlist)}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">{playlist.name}</h3>
                                        {playlist.description && (
                                            <p className="text-sm text-text-secondary line-clamp-1">
                                                {playlist.description}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeletePlaylist(playlist.$id);
                                        }}
                                        className="p-2 rounded-lg hover:bg-error/20 text-text-secondary hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Playlist Tracks */}
                <div className="lg:col-span-2">
                    {selectedPlaylist ? (
                        <div className="glass rounded-xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-display font-bold">
                                        {selectedPlaylist.name}
                                    </h2>
                                    <p className="text-text-secondary">
                                        {playlistTracks.length} track{playlistTracks.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                {playlistTracks.length > 0 && (
                                    <button
                                        onClick={handlePlayAll}
                                        className="flex items-center gap-2 px-4 py-2 bg-accent rounded-full font-medium hover:bg-accent/90 transition-colors"
                                    >
                                        <Play size={18} />
                                        Play All
                                    </button>
                                )}
                            </div>

                            {isLoadingTracks ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="p-4 rounded-xl glass-dark">
                                            <div className="aspect-square rounded-lg skeleton mb-4" />
                                            <div className="h-4 rounded skeleton mb-2" />
                                            <div className="h-3 rounded skeleton w-2/3" />
                                        </div>
                                    ))}
                                </div>
                            ) : playlistTracks.length === 0 ? (
                                <div className="text-center py-12">
                                    <Music size={48} className="mx-auto text-text-secondary/50 mb-4" />
                                    <p className="text-text-secondary">
                                        This playlist is empty. Add some tracks!
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                    {Array.isArray(playlists) && playlists.length > 0 ? (
                                        playlists.map((playlist) => (
                                            <MusicCard
                                                key={playlist.$id}
                                                track={{
                                                    $id: playlist.$id,
                                                    title: playlist.name,
                                                    artist: playlist.description || 'Playlist',
                                                    albumArt: (playlist as any).cover || (playlist as any).image || '',
                                                    duration: 0,
                                                    audio_url: '',
                                                    // Map other required fields or cast generic
                                                } as any}
                                            />
                                        ))
                                    ) : (
                                        playlistTracks.map((track) => (
                                            <MusicCard key={track.$id} track={track} />
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="glass rounded-xl p-12 text-center">
                            <ListMusic size={64} className="mx-auto text-text-secondary/30 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Select a Playlist</h3>
                            <p className="text-text-secondary">
                                Choose a playlist from the left to view its tracks
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
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md p-6 glass rounded-2xl m-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-2xl font-display font-bold mb-4">
                                Create New Playlist
                            </h2>
                            <input
                                type="text"
                                value={newPlaylistName}
                                onChange={(e) => setNewPlaylistName(e.target.value)}
                                placeholder="Playlist name"
                                className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-white/10 focus:border-accent outline-none transition-colors mb-4"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl glass hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreatePlaylist}
                                    disabled={!newPlaylistName.trim() || isCreating}
                                    className="flex-1 px-4 py-3 rounded-xl bg-accent hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCreating ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
