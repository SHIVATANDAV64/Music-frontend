/**
 * Admin Upload Page
 * Upload audio files and manage content (admin only)
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Music, Mic2, X, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { storage, BUCKETS, ID } from '../lib/appwrite';
import { adminUpload } from '../lib/functions';
import { musicService } from '../services/musicService';
import { usePlayer } from '../context/PlayerContext';
import { Trash2, Play } from 'lucide-react';
import type { Track } from '../types';

type ContentType = 'track' | 'podcast';

interface UploadState {
    isUploading: boolean;
    progress: number;
    error: string | null;
    success: boolean;
}

export function AdminUpload() {
    const { user, isAuthenticated } = useAuth();
    const { play } = usePlayer();
    const [contentType, setContentType] = useState<ContentType>('track');
    const [uploadedTracks, setUploadedTracks] = useState<Track[]>([]);
    const [isLoadingTracks, setIsLoadingTracks] = useState(false);

    // Fetch uploaded content
    useEffect(() => {
        if (isAuthenticated && user?.is_admin) {
            loadUploadedContent();
        }
    }, [isAuthenticated, user]);

    async function loadUploadedContent() {
        setIsLoadingTracks(true);
        try {
            const tracks = await musicService.getUploadedTracks();
            setUploadedTracks(tracks);
        } catch (error) {
            console.error('Failed to load content', error);
        } finally {
            setIsLoadingTracks(false);
        }
    }

    async function handleDeleteTrack(track: Track) {
        if (!confirm('Are you sure you want to delete this track? This cannot be undone.')) return;

        try {
            await musicService.deleteTrack(track);
            setUploadedTracks(prev => prev.filter(t => t.$id !== track.$id));
        } catch (error) {
            console.error('Failed to delete track', error);
            alert('Failed to delete track');
        }
    }
    const [uploadState, setUploadState] = useState<UploadState>({
        isUploading: false,
        progress: 0,
        error: null,
        success: false,
    });

    // Track form
    const [trackForm, setTrackForm] = useState({
        title: '',
        artist: '',
        album: '',
        genre: '',
        duration: 0,
    });

    // Podcast form
    const [podcastForm, setPodcastForm] = useState({
        title: '',
        author: '',
        description: '',
        category: '',
    });

    // File refs
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);

    // Check admin access
    if (!isAuthenticated || !user?.is_admin) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle size={64} className="text-error/50 mb-4" />
                <h2 className="text-2xl font-display font-semibold mb-2">Access Denied</h2>
                <p className="text-secondary">
                    You must be an admin to access this page.
                </p>
            </div>
        );
    }

    async function handleUpload() {
        if (!audioFile) {
            setUploadState((s) => ({ ...s, error: 'Audio file is required' }));
            return;
        }

        setUploadState({ isUploading: true, progress: 0, error: null, success: false });

        try {
            // Upload audio file
            setUploadState((s) => ({ ...s, progress: 20 }));
            const audioUpload = await storage.createFile(
                BUCKETS.AUDIO,
                ID.unique(),
                audioFile
            );

            // Upload cover image if provided
            let coverImageId = null;
            if (coverFile) {
                setUploadState((s) => ({ ...s, progress: 50 }));
                try {
                    const coverUpload = await storage.createFile(
                        BUCKETS.COVERS,
                        ID.unique(),
                        coverFile
                    );
                    coverImageId = coverUpload.$id;
                } catch (e: any) {
                    console.error('Cover upload failed:', e);
                    // Don't block the audio upload if only cover fails, 
                    // but inform the user if it's a permission issue
                    if (e.code === 401 || e.code === 403) {
                        alert('Warning: Cover image upload failed due to permission issues with the COVERS bucket. The track will be uploaded without a cover.');
                    }
                }
            }

            setUploadState((s) => ({ ...s, progress: 70 }));

            if (contentType === 'track') {
                // Create track document via function
                const result = await adminUpload({
                    contentType: 'track',
                    data: {
                        title: trackForm.title,
                        artist: trackForm.artist,
                        album: trackForm.album || null,
                        genre: trackForm.genre || null,
                        duration: trackForm.duration || 0,
                        audioFileId: audioUpload.$id,
                        coverImageId: coverImageId,
                    },
                });
                if (!result.success) {
                    throw new Error(result.error || 'Failed to create track');
                }
            } else {
                // Create podcast document via function
                const result = await adminUpload({
                    contentType: 'podcast',
                    data: {
                        title: podcastForm.title,
                        author: podcastForm.author,
                        description: podcastForm.description || null,
                        category: podcastForm.category || null,
                        coverImageId: coverImageId,
                    },
                });
                if (!result.success) {
                    throw new Error(result.error || 'Failed to create podcast');
                }
            }

            setUploadState({ isUploading: false, progress: 100, error: null, success: true });

            // Reset form
            setTrackForm({ title: '', artist: '', album: '', genre: '', duration: 0 });
            setPodcastForm({ title: '', author: '', description: '', category: '' });
            setAudioFile(null);
            setCoverFile(null);

            // Refresh content list
            loadUploadedContent();
        } catch (error) {
            console.error('Upload error:', error);
            const msg = error instanceof Error ? error.message : 'Unknown error';
            let userMsg = msg;

            if (msg.includes('401') || msg.includes('403') || msg.includes('unauthorized')) {
                userMsg = 'Permission Denied: Please check Storage Bucket permissions in Appwrite Console. You may need to allow "write" access for Admins.';
            }

            setUploadState({
                isUploading: false,
                progress: 0,
                error: userMsg,
                success: false,
            });
        }
    }

    function handleAudioPreview(file: File) {
        // Get duration from audio file
        const audio = new Audio();
        audio.src = URL.createObjectURL(file);
        audio.onloadedmetadata = () => {
            setTrackForm((f) => ({ ...f, duration: Math.round(audio.duration) }));
            URL.revokeObjectURL(audio.src);
        };
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                    <Upload size={24} className="text-accent" />
                </div>
                <div>
                    <h1 className="text-3xl font-display font-bold text-primary">Upload Content</h1>
                    <p className="text-secondary">Add new tracks or podcasts</p>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={() => setContentType('track')}
                    className={`flex-1 p-4 rounded-xl flex items-center justify-center gap-2 transition-all ${contentType === 'track'
                        ? 'btn-primary shadow-lg shadow-accent/20'
                        : 'glass text-secondary hover:bg-hover'
                        }`}
                >
                    <Music size={20} />
                    Track
                </button>
                <button
                    onClick={() => setContentType('podcast')}
                    className={`flex-1 p-4 rounded-xl flex items-center justify-center gap-2 transition-all ${contentType === 'podcast'
                        ? 'btn-primary shadow-lg shadow-accent/20'
                        : 'glass text-secondary hover:bg-hover'
                        }`}
                >
                    <Mic2 size={20} />
                    Podcast
                </button>
            </div>

            {/* Upload Form */}
            <div className="glass rounded-xl p-6 space-y-4">
                {contentType === 'track' ? (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-primary">Title *</label>
                            <input
                                type="text"
                                value={trackForm.title}
                                onChange={(e) => setTrackForm((f) => ({ ...f, title: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-secondary text-primary border border-theme focus:border-accent outline-none transition-colors"
                                placeholder="Track title"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-primary">Artist *</label>
                            <input
                                type="text"
                                value={trackForm.artist}
                                onChange={(e) => setTrackForm((f) => ({ ...f, artist: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-secondary text-primary border border-theme focus:border-accent outline-none transition-colors"
                                placeholder="Artist name"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-primary">Album</label>
                                <input
                                    type="text"
                                    value={trackForm.album}
                                    onChange={(e) => setTrackForm((f) => ({ ...f, album: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl bg-secondary text-primary border border-theme focus:border-accent outline-none transition-colors"
                                    placeholder="Album name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-primary">Genre</label>
                                <select
                                    value={trackForm.genre}
                                    onChange={(e) => setTrackForm((f) => ({ ...f, genre: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl bg-secondary text-primary border border-theme focus:border-accent outline-none transition-colors"
                                >
                                    <option value="">Select genre</option>
                                    <option value="Pop">Pop</option>
                                    <option value="Rock">Rock</option>
                                    <option value="Hip-Hop">Hip-Hop</option>
                                    <option value="Electronic">Electronic</option>
                                    <option value="Classical">Classical</option>
                                    <option value="Jazz">Jazz</option>
                                    <option value="R&B">R&B</option>
                                </select>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-primary">Title *</label>
                            <input
                                type="text"
                                value={podcastForm.title}
                                onChange={(e) => setPodcastForm((f) => ({ ...f, title: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-secondary text-primary border border-theme focus:border-accent outline-none transition-colors"
                                placeholder="Podcast title"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-primary">Author *</label>
                            <input
                                type="text"
                                value={podcastForm.author}
                                onChange={(e) => setPodcastForm((f) => ({ ...f, author: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-secondary text-primary border border-theme focus:border-accent outline-none transition-colors"
                                placeholder="Author name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-primary">Description</label>
                            <textarea
                                value={podcastForm.description}
                                onChange={(e) => setPodcastForm((f) => ({ ...f, description: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-secondary text-primary border border-theme focus:border-accent outline-none transition-colors resize-none"
                                rows={3}
                                placeholder="Podcast description"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-primary">Category</label>
                            <input
                                type="text"
                                value={podcastForm.category}
                                onChange={(e) => setPodcastForm((f) => ({ ...f, category: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-secondary text-primary border border-theme focus:border-accent outline-none transition-colors"
                                placeholder="e.g., Technology, Comedy, News"
                            />
                        </div>
                    </>
                )}

                {/* File Uploads */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                    {/* Audio File */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-primary">
                            Audio File * {trackForm.duration > 0 && `(${Math.floor(trackForm.duration / 60)}:${String(trackForm.duration % 60).padStart(2, '0')})`}
                        </label>
                        <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-theme hover:border-accent cursor-pointer transition-colors">
                            <input
                                type="file"
                                accept="audio/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setAudioFile(file);
                                        handleAudioPreview(file);
                                    }
                                }}
                            />
                            {audioFile ? (
                                <div className="text-center">
                                    <Check size={24} className="mx-auto text-success mb-2" />
                                    <span className="text-sm truncate max-w-full text-primary">{audioFile.name}</span>
                                </div>
                            ) : (
                                <>
                                    <Music size={24} className="text-secondary mb-2" />
                                    <span className="text-sm text-secondary">Select audio</span>
                                </>
                            )}
                        </label>
                    </div>

                    {/* Cover Image */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-primary">Cover Image</label>
                        <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-theme hover:border-accent cursor-pointer transition-colors">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                            />
                            {coverFile ? (
                                <div className="text-center">
                                    <Check size={24} className="mx-auto text-success mb-2" />
                                    <span className="text-sm truncate max-w-full text-primary">{coverFile.name}</span>
                                </div>
                            ) : (
                                <>
                                    <Upload size={24} className="text-secondary mb-2" />
                                    <span className="text-sm text-secondary">Select image</span>
                                </>
                            )}
                        </label>
                    </div>
                </div>

                {/* Error/Success Messages */}
                {uploadState.error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-4 rounded-xl bg-error/20 text-error"
                    >
                        <X size={18} />
                        {uploadState.error}
                    </motion.div>
                )}

                {uploadState.success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-4 rounded-xl bg-success/20 text-success"
                    >
                        <Check size={18} />
                        Upload successful!
                    </motion.div>
                )}

                {/* Upload Progress */}
                {uploadState.isUploading && (
                    <div className="space-y-2">
                        <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
                            <motion.div
                                className="h-full bg-accent"
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadState.progress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                        <p className="text-sm text-secondary text-center">
                            Uploading... {uploadState.progress}%
                        </p>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    onClick={handleUpload}
                    disabled={uploadState.isUploading || !audioFile || (contentType === 'track' ? !trackForm.title || !trackForm.artist : !podcastForm.title || !podcastForm.author)}
                    className="btn btn-primary w-full py-4 rounded-xl font-bold shadow-xl shadow-black/40 hover:brightness-110 active:scale-95 transition-all"
                >
                    {uploadState.isUploading ? 'Uploading...' : `Upload ${contentType === 'track' ? 'Track' : 'Podcast'}`}
                </button>
            </div>

            {/* Manage Content Section */}
            <div className="pt-12 border-t border-theme">
                <h2 className="text-2xl font-display font-bold mb-6 text-primary">Manage Content</h2>

                {isLoadingTracks ? (
                    <div className="text-center py-10 text-text-secondary">Loading content...</div>
                ) : uploadedTracks.length === 0 ? (
                    <div className="text-center py-10 glass rounded-xl">
                        <p className="text-secondary">No uploaded content yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {uploadedTracks.map((track) => (
                            <div key={track.$id} className="glass p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-colors group">
                                {/* Track Image */}
                                <div className="w-12 h-12 rounded-lg bg-white/10 overflow-hidden relative flex-shrink-0">
                                    {track.cover_image_id || track.cover_url ? (
                                        <img
                                            src={storage.getFileView(BUCKETS.COVERS, track.cover_image_id!) || track.cover_url}
                                            alt={track.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Music size={20} className="text-white/20" />
                                        </div>
                                    )}

                                    {/* Play Overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <button
                                            onClick={() => play(track)}
                                            className="p-1 rounded-full bg-accent text-white hover:scale-110 transition-transform"
                                        >
                                            <Play size={16} fill="currentColor" />
                                        </button>
                                    </div>
                                </div>

                                {/* Track Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium truncate text-primary">{track.title}</h3>
                                    <p className="text-sm text-secondary truncate">{track.artist}</p>
                                </div>

                                {/* Metadata */}
                                <div className="hidden md:flex gap-8 text-sm text-secondary">
                                    <span>{track.genre || 'Unknown Genre'}</span>
                                    <span>{Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}</span>
                                </div>

                                {/* Actions */}
                                <button
                                    onClick={() => handleDeleteTrack(track)}
                                    className="p-2 rounded-lg hover:bg-error/20 text-secondary hover:text-error transition-colors"
                                    title="Delete Track"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}
