/**
 * Admin Upload Page - Ingestion Terminal
 * 
 * Philosophy: Data Ingestion Port.
 * Industrial, high-contrast, strictly functional.
 */
import { useState, useEffect } from 'react';

import { Upload, X, Check, AlertCircle, Trash2, FileAudio, Image as ImageIcon, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { storage, BUCKETS, ID } from '../lib/appwrite';
import { adminUpload } from '../lib/functions';
import { musicService } from '../services/musicService';
import { usePlayer } from '../context/PlayerContext';
import { getTrackCoverUrl } from '../utils/trackUtils';
import { Button, Input } from '../components/ui';
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
    const { } = usePlayer();
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
        if (!confirm('CONFIRM DELETION: This action is irreversible. Proceed?')) return;

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
            <div className="flex flex-col items-center justify-center py-20 border border-red-500/20 bg-red-500/5 m-8">
                <AlertCircle size={64} className="text-red-500 mb-4" />
                <h2 className="text-2xl font-display font-bold text-red-500 mb-2 uppercase tracking-widest">Access Denied</h2>
                <p className="font-mono text-red-500/60 uppercase">
                    Clearance Level Insufficient. Admin Privileges Required.
                </p>
            </div>
        );
    }

    async function handleUpload() {
        if (!audioFile) {
            setUploadState((s) => ({ ...s, error: 'AUDIO_FILE_MISSING' }));
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
                    if (e.code === 401 || e.code === 403) {
                        alert('WARNING: COVER_UPLOAD_PERMISSION_DENIED. PROCEEDING_WITHOUT_COVER.');
                    }
                }
            }

            setUploadState((s) => ({ ...s, progress: 70 }));

            if (contentType === 'track') {
                const result = await adminUpload({
                    contentType: 'track',
                    data: {
                        title: trackForm.title,
                        artist: trackForm.artist,
                        album: trackForm.album || null,
                        genre: trackForm.genre || null,
                        duration: trackForm.duration || 0,
                        audioFileId: audioUpload.$id,
                        audioFilename: audioFile.name,
                        coverImageId: coverImageId,
                        coverFilename: coverFile?.name || null,
                    },
                });
                if (!result.success) throw new Error(result.error || 'TRACK_CREATION_FAILED');
            } else {
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
                if (!result.success) throw new Error(result.error || 'PODCAST_CREATION_FAILED');
            }

            setUploadState({ isUploading: false, progress: 100, error: null, success: true });

            // Reset
            setTrackForm({ title: '', artist: '', album: '', genre: '', duration: 0 });
            setPodcastForm({ title: '', author: '', description: '', category: '' });
            setAudioFile(null);
            setCoverFile(null);
            loadUploadedContent();

        } catch (error) {
            console.error('Upload error:', error);
            const msg = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
            let userMsg = msg;

            if (msg.includes('401') || msg.includes('403') || msg.includes('unauthorized')) {
                userMsg = 'PERMISSION_DENIED: CHECK_BUCKET_POLICIES';
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
        const audio = new Audio();
        audio.src = URL.createObjectURL(file);
        audio.onloadedmetadata = () => {
            setTrackForm((f) => ({ ...f, duration: Math.round(audio.duration) }));
            URL.revokeObjectURL(audio.src);
        };
    }

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-8">
            {/* Header */}
            <div className="border-b border-[var(--color-border)] pb-8 flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 border border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]">
                            <Database size={20} />
                        </div>
                        <h1 className="text-3xl font-display uppercase tracking-widest text-[var(--color-text-primary)]">Ingestion Terminal</h1>
                    </div>
                    <p className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-wider pl-[50px]">
                        // SYSTEM_MODE: UPLOAD__ACTIVE
                    </p>
                </div>

                {/* Mode Switcher */}
                <div className="flex bg-[var(--color-card)] border border-[var(--color-border)] p-1">
                    <button
                        onClick={() => setContentType('track')}
                        className={`px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-all ${contentType === 'track'
                            ? 'bg-[var(--color-accent-gold)] text-black font-bold'
                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                            }`}
                    >
                        Track_Mode
                    </button>
                    <button
                        onClick={() => setContentType('podcast')}
                        className={`px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-all ${contentType === 'podcast'
                            ? 'bg-[var(--color-accent-gold)] text-black font-bold'
                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                            }`}
                    >
                        Podcast_Mode
                    </button>
                </div>
            </div>

            {/* Upload Form Container */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Metadata Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 relative group">
                        <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-[var(--color-border)] group-hover:border-[var(--color-accent-gold)] transition-colors" />

                        <h3 className="font-display text-[var(--color-text-primary)] mb-6 uppercase tracking-wider">Metadata Parameters</h3>

                        <div className="space-y-4">
                            {contentType === 'track' ? (
                                <>
                                    <Input
                                        label="Title"
                                        value={trackForm.title}
                                        onChange={(e) => setTrackForm((f) => ({ ...f, title: e.target.value }))}
                                        placeholder="TRACK_INDENTIFIER"
                                    />
                                    <Input
                                        label="Artist"
                                        value={trackForm.artist}
                                        onChange={(e) => setTrackForm((f) => ({ ...f, artist: e.target.value }))}
                                        placeholder="ARTIST_KEY"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Album"
                                            value={trackForm.album}
                                            onChange={(e) => setTrackForm((f) => ({ ...f, album: e.target.value }))}
                                            placeholder="ALBUM_REF"
                                        />
                                        <div className="space-y-2 group">
                                            <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent-gold)] transition-colors">
                                                Genre_Tag
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={trackForm.genre}
                                                    onChange={(e) => setTrackForm((f) => ({ ...f, genre: e.target.value }))}
                                                    className="w-full px-4 py-3 bg-[var(--color-void)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono text-sm focus:outline-none focus:border-[var(--color-accent-gold)] transition-all appearance-none"
                                                >
                                                    <option value="" className="bg-[var(--color-void)]">SELECT_GENRE</option>
                                                    {['Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Classical', 'Jazz', 'R&B'].map(g => (
                                                        <option key={g} value={g} className="bg-[var(--color-void)]">{g.toUpperCase()}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-[var(--color-border)] pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Input
                                        label="Podcast Title"
                                        value={podcastForm.title}
                                        onChange={(e) => setPodcastForm((f) => ({ ...f, title: e.target.value }))}
                                    />
                                    <Input
                                        label="Author"
                                        value={podcastForm.author}
                                        onChange={(e) => setPodcastForm((f) => ({ ...f, author: e.target.value }))}
                                    />
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-muted)]">Description</label>
                                        <textarea
                                            value={podcastForm.description}
                                            onChange={(e) => setPodcastForm((f) => ({ ...f, description: e.target.value }))}
                                            className="w-full px-4 py-3 bg-[var(--color-void)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono text-sm focus:border-[var(--color-accent-gold)] outline-none"
                                            rows={3}
                                        />
                                    </div>
                                    <Input
                                        label="Category"
                                        value={podcastForm.category}
                                        onChange={(e) => setPodcastForm((f) => ({ ...f, category: e.target.value }))}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Col: Upload Zones */}
                <div className="space-y-6">
                    {/* Audio Upload */}
                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6">
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
                            Audio_Payload
                            {trackForm.duration > 0 && <span className="text-[var(--color-accent-gold)] ml-2">[{Math.floor(trackForm.duration / 60)}:{String(trackForm.duration % 60).padStart(2, '0')}]</span>}
                        </label>
                        <label className={`
                            flex flex-col items-center justify-center h-32 border border-dashed transition-all cursor-pointer group relative overflow-hidden
                            ${audioFile ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-card-hover)]'}
                        `}>
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
                                <div className="text-center z-10">
                                    <FileAudio className="mx-auto text-[var(--color-accent-gold)] mb-2" size={24} />
                                    <p className="font-mono text-[10px] text-[var(--color-accent-gold)] truncate max-w-[150px]">{audioFile.name}</p>
                                </div>
                            ) : (
                                <div className="text-center z-10">
                                    <Upload className="mx-auto text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] mb-2 transition-colors" size={24} />
                                    <span className="font-mono text-[10px] text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)]">INITIATE UPLOAD</span>
                                </div>
                            )}

                            {/* Scanning effect */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-accent-gold)]/5 to-transparent translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000 pointer-events-none" />
                        </label>
                    </div>

                    {/* Cover Upload */}
                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6">
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-muted)] mb-3">Visual_Data</label>
                        <label className={`
                            flex flex-col items-center justify-center h-32 border border-dashed transition-all cursor-pointer group
                            ${coverFile ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-card-hover)]'}
                        `}>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
                            {coverFile ? (
                                <div className="text-center">
                                    <ImageIcon className="mx-auto text-[var(--color-accent-gold)] mb-2" size={24} />
                                    <p className="font-mono text-[10px] text-[var(--color-accent-gold)] truncate max-w-[150px]">{coverFile.name}</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <Upload className="mx-auto text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] mb-2 transition-colors" size={24} />
                                    <span className="font-mono text-[10px] text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)]">SELECT IMAGE</span>
                                </div>
                            )}
                        </label>
                    </div>

                    <Button
                        onClick={handleUpload}
                        isLoading={uploadState.isUploading}
                        variant="primary"
                        className="w-full"
                        disabled={!audioFile || (contentType === 'track' ? !trackForm.title || !trackForm.artist : !podcastForm.title || !podcastForm.author)}
                    >
                        EXECUTE_INGESTION
                    </Button>

                    {/* Feedback Messages */}
                    {uploadState.error && (
                        <div className="p-4 border border-red-500/30 bg-red-500/5 text-red-500 font-mono text-xs flex items-center gap-2">
                            <X size={14} /> {uploadState.error}
                        </div>
                    )}
                    {uploadState.success && (
                        <div className="p-4 border border-[var(--color-accent-gold)]/30 bg-[var(--color-accent-gold)]/5 text-[var(--color-accent-gold)] font-mono text-xs flex items-center gap-2">
                            <Check size={14} /> INGESTION_COMPLETE
                        </div>
                    )}
                </div>
            </div>

            {/* Database Log */}
            <div className="mt-12">
                <div className="flex items-center gap-4 mb-6 border-b border-[var(--color-border)] pb-2">
                    <h2 className="font-display text-[var(--color-text-primary)] uppercase tracking-widest">Database_Log</h2>
                    <span className="font-mono text-xs text-[var(--color-text-muted)]">TYPE: AUDIO_TRACKS</span>
                </div>

                {isLoadingTracks ? (
                    <div className="font-mono text-xs text-[var(--color-accent-gold)] animate-pulse">READING_DATABASE...</div>
                ) : uploadedTracks.length === 0 ? (
                    <div className="p-8 border border-dashed border-[var(--color-border)] text-center font-mono text-xs text-[var(--color-text-muted)]">
                        LOG_EMPTY
                    </div>
                ) : (
                    <div className="border border-[var(--color-border)] divide-y divide-[var(--color-border)] bg-[var(--color-card)]">
                        {uploadedTracks.map((track) => (
                            <div key={track.$id} className="p-4 flex items-center gap-4 hover:bg-[var(--color-card-hover)] transition-colors group">
                                <div className="w-8 h-8 bg-[var(--color-void)] flex items-center justify-center relative overflow-hidden">
                                    {getTrackCoverUrl(track) ? (
                                        <img src={getTrackCoverUrl(track)!} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                                    ) : (
                                        <div className="w-full h-full bg-[var(--color-accent-gold)]/20" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="font-mono text-xs text-[var(--color-text-primary)] truncate">{track.title}</div>
                                    <div className="font-mono text-[10px] text-[var(--color-text-muted)] truncate">{track.artist}</div>
                                </div>

                                <div className="hidden md:flex gap-8 font-mono text-[10px] text-[var(--color-text-muted)]">
                                    <span className="w-20">{track.genre || 'N/A'}</span>
                                    <span className="w-12">{Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}</span>
                                </div>

                                <button
                                    onClick={() => handleDeleteTrack(track)}
                                    className="p-2 text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
                                    title="PURGE_ENTRY"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
