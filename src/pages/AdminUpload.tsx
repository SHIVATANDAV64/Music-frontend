/**
 * Admin Upload Page
 * Upload audio files and manage content (admin only)
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Music, Mic2, X, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { storage, databases, DATABASE_ID, COLLECTIONS, BUCKETS, ID } from '../lib/appwrite';

type ContentType = 'track' | 'podcast';

interface UploadState {
    isUploading: boolean;
    progress: number;
    error: string | null;
    success: boolean;
}

export function AdminUpload() {
    const { user, isAuthenticated } = useAuth();
    const [contentType, setContentType] = useState<ContentType>('track');
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
                <p className="text-text-secondary">
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
                const coverUpload = await storage.createFile(
                    BUCKETS.COVERS,
                    ID.unique(),
                    coverFile
                );
                coverImageId = coverUpload.$id;
            }

            setUploadState((s) => ({ ...s, progress: 70 }));

            if (contentType === 'track') {
                // Create track document
                await databases.createDocument(
                    DATABASE_ID,
                    COLLECTIONS.TRACKS,
                    ID.unique(),
                    {
                        title: trackForm.title,
                        artist: trackForm.artist,
                        album: trackForm.album || null,
                        genre: trackForm.genre || null,
                        duration: trackForm.duration || 0,
                        audio_file_id: audioUpload.$id,
                        cover_image_id: coverImageId,
                        play_count: 0,
                    }
                );
            } else {
                // Create podcast document
                await databases.createDocument(
                    DATABASE_ID,
                    COLLECTIONS.PODCASTS,
                    ID.unique(),
                    {
                        title: podcastForm.title,
                        author: podcastForm.author,
                        description: podcastForm.description || null,
                        category: podcastForm.category || null,
                        cover_image_id: coverImageId,
                    }
                );
            }

            setUploadState({ isUploading: false, progress: 100, error: null, success: true });

            // Reset form
            setTrackForm({ title: '', artist: '', album: '', genre: '', duration: 0 });
            setPodcastForm({ title: '', author: '', description: '', category: '' });
            setAudioFile(null);
            setCoverFile(null);
        } catch (error) {
            console.error('Upload error:', error);
            setUploadState({
                isUploading: false,
                progress: 0,
                error: error instanceof Error ? error.message : 'Upload failed',
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
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Upload size={24} className="text-green-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-display font-bold">Upload Content</h1>
                    <p className="text-text-secondary">Add new tracks or podcasts</p>
                </div>
            </div>

            {/* Content Type Selector */}
            <div className="flex gap-3">
                <button
                    onClick={() => setContentType('track')}
                    className={`flex-1 p-4 rounded-xl flex items-center justify-center gap-2 transition-all ${contentType === 'track'
                            ? 'bg-accent text-white'
                            : 'glass text-text-secondary hover:bg-white/10'
                        }`}
                >
                    <Music size={20} />
                    Track
                </button>
                <button
                    onClick={() => setContentType('podcast')}
                    className={`flex-1 p-4 rounded-xl flex items-center justify-center gap-2 transition-all ${contentType === 'podcast'
                            ? 'bg-accent text-white'
                            : 'glass text-text-secondary hover:bg-white/10'
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
                            <label className="block text-sm font-medium mb-2">Title *</label>
                            <input
                                type="text"
                                value={trackForm.title}
                                onChange={(e) => setTrackForm((f) => ({ ...f, title: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-white/10 focus:border-accent outline-none transition-colors"
                                placeholder="Track title"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Artist *</label>
                            <input
                                type="text"
                                value={trackForm.artist}
                                onChange={(e) => setTrackForm((f) => ({ ...f, artist: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-white/10 focus:border-accent outline-none transition-colors"
                                placeholder="Artist name"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Album</label>
                                <input
                                    type="text"
                                    value={trackForm.album}
                                    onChange={(e) => setTrackForm((f) => ({ ...f, album: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-white/10 focus:border-accent outline-none transition-colors"
                                    placeholder="Album name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Genre</label>
                                <select
                                    value={trackForm.genre}
                                    onChange={(e) => setTrackForm((f) => ({ ...f, genre: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-white/10 focus:border-accent outline-none transition-colors"
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
                            <label className="block text-sm font-medium mb-2">Title *</label>
                            <input
                                type="text"
                                value={podcastForm.title}
                                onChange={(e) => setPodcastForm((f) => ({ ...f, title: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-white/10 focus:border-accent outline-none transition-colors"
                                placeholder="Podcast title"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Author *</label>
                            <input
                                type="text"
                                value={podcastForm.author}
                                onChange={(e) => setPodcastForm((f) => ({ ...f, author: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-white/10 focus:border-accent outline-none transition-colors"
                                placeholder="Author name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Description</label>
                            <textarea
                                value={podcastForm.description}
                                onChange={(e) => setPodcastForm((f) => ({ ...f, description: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-white/10 focus:border-accent outline-none transition-colors resize-none"
                                rows={3}
                                placeholder="Podcast description"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Category</label>
                            <input
                                type="text"
                                value={podcastForm.category}
                                onChange={(e) => setPodcastForm((f) => ({ ...f, category: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-white/10 focus:border-accent outline-none transition-colors"
                                placeholder="e.g., Technology, Comedy, News"
                            />
                        </div>
                    </>
                )}

                {/* File Uploads */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                    {/* Audio File */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Audio File * {trackForm.duration > 0 && `(${Math.floor(trackForm.duration / 60)}:${String(trackForm.duration % 60).padStart(2, '0')})`}
                        </label>
                        <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-white/20 hover:border-accent cursor-pointer transition-colors">
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
                                    <span className="text-sm truncate max-w-full">{audioFile.name}</span>
                                </div>
                            ) : (
                                <>
                                    <Music size={24} className="text-text-secondary mb-2" />
                                    <span className="text-sm text-text-secondary">Select audio</span>
                                </>
                            )}
                        </label>
                    </div>

                    {/* Cover Image */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Cover Image</label>
                        <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-white/20 hover:border-accent cursor-pointer transition-colors">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                            />
                            {coverFile ? (
                                <div className="text-center">
                                    <Check size={24} className="mx-auto text-success mb-2" />
                                    <span className="text-sm truncate max-w-full">{coverFile.name}</span>
                                </div>
                            ) : (
                                <>
                                    <Upload size={24} className="text-text-secondary mb-2" />
                                    <span className="text-sm text-text-secondary">Select image</span>
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
                        <p className="text-sm text-text-secondary text-center">
                            Uploading... {uploadState.progress}%
                        </p>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    onClick={handleUpload}
                    disabled={uploadState.isUploading || !audioFile || (contentType === 'track' ? !trackForm.title || !trackForm.artist : !podcastForm.title || !podcastForm.author)}
                    className="w-full py-4 rounded-xl bg-accent hover:bg-accent/90 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {uploadState.isUploading ? 'Uploading...' : `Upload ${contentType === 'track' ? 'Track' : 'Podcast'}`}
                </button>
            </div>
        </div>
    );
}
