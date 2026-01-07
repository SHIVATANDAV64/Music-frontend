/**
 * Fullscreen Player - Cinematic Glass Experience
 * 
 * Redesigned to prioritize the Visualizer (Sound made visible).
 * Controls are floating in a glass dock at the bottom.
 * Text is elegant and unobtrusive.
 */
import { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Minimize2, Heart, ListMusic, Volume2, Volume1, VolumeX, Eye, EyeOff, Plus } from 'lucide-react';
import { extractDominantColor } from '../../utils/colorExtractor';
// import { getLyrics, type LyricsResult } from '../../services/lyrics.service';
import { CymaticsVisualizer, VisualizerToggle } from '../ui/CymaticsVisualizer';
import { usePlayer } from '../../context/PlayerContext';
import { BreathingWaveform } from './BreathingWaveform';
import { favoritesService } from '../../services/favorites.service';
import { useAuth } from '../../context/AuthContext';
import { QueuePanel } from './QueuePanel';
import { PlaylistSelector } from './PlaylistSelector';
import { useRef } from 'react';
import type { Track } from '../../types';

interface FullscreenPlayerProps {
    trackName: string | null;
    artistName: string | null;
    albumArt: string | null;
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    isVisible: boolean;
    onClose: () => void;
}

export function FullscreenPlayer({
    trackName,
    artistName,
    albumArt,
    currentTime,
    duration,
    isPlaying,
    isVisible,
    onClose,
}: FullscreenPlayerProps) {
    const {
        currentTrack,
        pause, resume, next, previous,
        shuffle, toggleShuffle, repeat, toggleRepeat,
        volume, setVolume
    } = usePlayer();
    const { user } = useAuth();

    // const [lyrics, setLyrics] = useState<LyricsResult | null>(null);
    // const [activeLineIndex, setActiveLineIndex] = useState(-1);
    const [themeColor, setThemeColor] = useState('#d4af37'); // Default gold
    const [visualizerMode, setVisualizerMode] = useState<'chladni' | 'water' | 'sacred' | 'turing' | 'voronoi' | 'hopf'>('sacred');
    const [isFavorite, setIsFavorite] = useState(false);
    const [isAddingFavorite, setIsAddingFavorite] = useState(false);
    const [showQueue, setShowQueue] = useState(false);
    const [showUI, setShowUI] = useState(true);
    const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);

    // Resize Logic
    const [width, setWidth] = useState<number>(768); // Default max-w-3xl approx
    const [height, setHeight] = useState<number>(200); // Default comfortable height
    const resizingDirection = useRef<'left' | 'right' | 'top' | null>(null);
    const startX = useRef(0);
    const startY = useRef(0);
    const startWidth = useRef(0);
    const startHeight = useRef(0);
    const dockRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleMouseMove(e: MouseEvent) {
            if (!resizingDirection.current) return;

            if (resizingDirection.current === 'right') {
                const delta = (e.clientX - startX.current) * 2;
                const newWidth = Math.max(320, Math.min(window.innerWidth - 32, startWidth.current + delta));
                setWidth(newWidth);
            } else if (resizingDirection.current === 'left') {
                const delta = (startX.current - e.clientX) * 2; // Inverted for left side
                const newWidth = Math.max(320, Math.min(window.innerWidth - 32, startWidth.current + delta));
                setWidth(newWidth);
            } else if (resizingDirection.current === 'top') {
                // For fullscreen dock, dragging UP increases height
                const delta = startY.current - e.clientY;
                const newHeight = Math.max(160, Math.min(600, startHeight.current + delta));
                setHeight(newHeight);
            }
        }

        function handleMouseUp() {
            resizingDirection.current = null;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const handleResizeStart = (e: React.MouseEvent, direction: 'left' | 'right' | 'top') => {
        e.preventDefault();
        e.stopPropagation();
        resizingDirection.current = direction;

        startX.current = e.clientX;
        startY.current = e.clientY;
        startWidth.current = width;
        startHeight.current = height;

        if (direction === 'top') {
            document.body.style.cursor = 'ns-resize';
        } else {
            document.body.style.cursor = 'ew-resize';
        }
        document.body.style.userSelect = 'none';
    };

    // Format time helper: 0:00
    const formatTime = (t: number) => {
        if (!Number.isFinite(t)) return '0:00';
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Extract colors
    useEffect(() => {
        if (!albumArt || !isVisible) return;
        extractDominantColor(albumArt).then((colorResult) => {
            // Convert RGB to hex string for components expecting hex colors
            const { r, g, b } = colorResult.rgb;
            const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            setThemeColor(hex);
        });
    }, [albumArt, isVisible]);

    // Check favorite status
    useEffect(() => {
        if (!user || !currentTrack || !isVisible) return;
        favoritesService.isFavorite(user.$id, currentTrack.$id)
            .then(setIsFavorite)
            .catch(() => setIsFavorite(false));
    }, [currentTrack?.$id, user?.$id, isVisible]);

    async function handleFavoriteClick() {
        if (!user || !currentTrack || isAddingFavorite) return;
        setIsAddingFavorite(true);
        try {
            const newState = await favoritesService.toggleFavorite(currentTrack as any);
            setIsFavorite(newState);
        } catch (err) {
            console.error('Failed to toggle favorite:', err);
        } finally {
            setIsAddingFavorite(false);
        }
    }

    // Fetch lyrics
    // useEffect(() => {
    //     if (!trackName || !artistName || !isVisible) {
    //         setLyrics(null);
    //         return;
    //     }
    //     getLyrics(trackName, artistName)
    //         .then(setLyrics)
    //         .catch(err => console.error('Lyrics fetch failed:', err));
    // }, [trackName, artistName, isVisible]);

    // Sync Lyrics
    // useEffect(() => {
    //     if (!lyrics?.syncedLyrics) return;
    //     const lines = lyrics.syncedLyrics;
    //     let idx = -1;
    //     for (let i = lines.length - 1; i >= 0; i--) {
    //         if (currentTime >= lines[i].time) {
    //             idx = i;
    //             break;
    //         }
    //     }
    //     setActiveLineIndex(idx);
    // }, [currentTime, lyrics]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[200] flex flex-col animate-in fade-in duration-500 bg-[var(--color-void)] overflow-hidden font-sans">

            {/* 1. LAYER: VISUALIZER (The Hero) - Always visible, never hidden */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0">
                    <CymaticsVisualizer mode={visualizerMode} />
                </div>
                {/* Subtle vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--color-void)_100%)] opacity-60" />
            </div>

            {/* 2. LAYER: TOP BAR (Header) - Always visible Eye button */}
            <div className="relative z-50 w-full p-6 md:p-8 flex justify-between items-start">
                {/* Visualizer Toggle - persistent but subtle when UI hidden */}
                <div className={`backdrop-blur-md bg-[var(--color-card)]/20 rounded-full p-1 border border-[var(--color-border)] transition-all duration-700 ${showUI ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}>
                    <VisualizerToggle mode={visualizerMode} onModeChange={setVisualizerMode} />
                </div>

                <div className="flex items-center gap-3">
                    {/* UI Toggle Button - ALWAYS VISIBLE */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowUI(!showUI);
                        }}
                        className="group flex flex-col items-center gap-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                        title={showUI ? 'Hide UI' : 'Show UI'}
                    >
                        <div className="w-12 h-12 rounded-full backdrop-blur-md bg-[var(--color-card)]/5 border border-[var(--color-border)] flex items-center justify-center group-hover:bg-[var(--color-card)]/10 transition-all">
                            {showUI ? <EyeOff size={20} /> : <Eye size={20} />}
                        </div>
                    </button>

                    {/* Close Button - conditionally visible */}
                    <button
                        onClick={onClose}
                        className={`group flex flex-col items-center gap-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all duration-500 ${showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    >
                        <div className="w-12 h-12 rounded-full backdrop-blur-md bg-[var(--color-card)]/5 border border-[var(--color-border)] flex items-center justify-center group-hover:bg-[var(--color-card)]/10 transition-all">
                            <Minimize2 size={20} />
                        </div>
                    </button>
                </div>
            </div>

            {/* 3. LAYER: CENTER STAGE (Lyrics / Metadata) */}
            <div className="relative z-40 flex-1 flex flex-col items-center justify-center text-center px-4 -mt-20">
                {/* Immersive Metadata - visible when UI is hidden for focus */}
                {/* {!showUI && (
                    // <div className="mb-12 space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    //     <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white/90 tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                    //         {trackName || 'Unknown Track'}
                    //     </h2>
                    //     <p className="text-xl md:text-2xl text-[#d4af37]/80 font-medium tracking-[0.2em] drop-shadow-md italic uppercase opacity-80">
                    //         {artistName || 'Unknown Artist'}
                    //     </p>
                    // </div>
                // )} */}

                {/* Lyrics Highlight */}
                {/* <div className="h-24 flex items-center justify-center">
                    <p className="text-white/40 italic flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-current" />
                        Sound made visible
                        <span className="w-1 h-1 rounded-full bg-current" />
                    </p>
                </div> */}
            </div>

            {/* Persistent Waveform - visible even when UI is hidden */}
            {!showUI && (
                <div className="absolute bottom-20 left-12 right-12 z-40 h-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <BreathingWaveform
                        height={48}
                        color={themeColor}
                        showProgress={true}
                        className="w-full opacity-40"
                    />
                </div>
            )}

            {/* 4. LAYER: BOTTOM DOCK (Controls) */}
            <div className={`relative z-50 w-full pb-12 px-6 md:px-12 flex flex-col items-center transition-all duration-500 ${showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>

                {/* Glass Dock Container */}
                <div
                    ref={dockRef}
                    style={{ width: `${width}px`, height: `${height}px`, maxWidth: '100vw' }}
                    className="relative backdrop-blur-xl bg-[var(--color-card)]/60 border border-[var(--color-border)] rounded-lg p-6 md:p-8 shadow-2xl ring-1 ring-[var(--color-border)] flex flex-col justify-center overflow-hidden"
                >
                    {/* Tech Decorators */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[var(--color-accent-gold)]/50 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[var(--color-accent-gold)]/50 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[var(--color-accent-gold)]/50 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[var(--color-accent-gold)]/50 rounded-br-lg" />

                    {/* Resize Handles */}
                    {/* Vertical (Top) */}
                    <div
                        onMouseDown={(e) => handleResizeStart(e, 'top')}
                        className="absolute left-10 right-10 -top-1 h-3 cursor-ns-resize z-50 flex items-center justify-center group/handle transition-opacity"
                        title="Drag to resize height"
                    >
                        <div className="w-16 h-1 rounded-full bg-[var(--color-text-muted)]/20 group-hover/handle:bg-[var(--color-accent-gold)] shadow-lg" />
                    </div>

                    {/* Horizontal (Right) */}
                    <div
                        onMouseDown={(e) => handleResizeStart(e, 'right')}
                        className="absolute -right-1 top-10 bottom-10 w-3 cursor-ew-resize z-50 flex items-center justify-center group/handle transition-opacity"
                        title="Drag to resize width"
                    >
                        <div className="w-1 h-12 rounded-full bg-[var(--color-text-muted)]/20 group-hover/handle:bg-[var(--color-accent-gold)] shadow-lg" />
                    </div>

                    {/* Horizontal (Left) */}
                    <div
                        onMouseDown={(e) => handleResizeStart(e, 'left')}
                        className="absolute -left-1 top-10 bottom-10 w-3 cursor-ew-resize z-50 flex items-center justify-center group/handle transition-opacity"
                    >
                        <div className="w-1 h-12 rounded-full bg-[var(--color-text-muted)]/20 group-hover/handle:bg-[var(--color-accent-gold)] shadow-lg" />
                    </div>

                    {/* 
                       Layout matching Home screen:
                       Row 1: [Left: Metadata] [Center: Transport Controls] [Right: Utilities]
                       Row 2: [Waveform Scrubber]
                    */}

                    {/* Row 1: Main Controls Row */}
                    <div className="flex items-center justify-between w-full mb-6">

                        {/* LEFT: Track Info */}
                        <div className="flex flex-col min-w-0 flex-1">
                            <h4 className="text-[var(--color-text-primary)] text-sm md:text-base font-display tracking-widest uppercase truncate border-l-2 border-[var(--color-accent-gold)] pl-3">
                                {trackName || 'NO_SIGNAL'}
                            </h4>
                            <p className="text-[var(--color-text-muted)] text-xs md:text-sm truncate font-mono uppercase pl-3 mt-1">
                                {artistName || 'UNKNOWN_UNIT'}
                            </p>
                        </div>

                        {/* CENTER: Transport Controls */}
                        <div className="flex items-center gap-4 md:gap-8">
                            <button onClick={previous} className="group p-2">
                                <SkipBack size={20} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] transition-colors" />
                            </button>

                            <button
                                onClick={toggleShuffle}
                                className={`p-1.5 rounded-sm border ${shuffle ? 'border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
                                title="Shuffle"
                            >
                                <Shuffle size={14} />
                            </button>

                            <button
                                onClick={isPlaying ? pause : resume}
                                className="w-16 h-16 rounded-full bg-transparent border border-[var(--color-accent-gold)] text-[var(--color-accent-gold)] flex items-center justify-center hover:bg-[var(--color-accent-gold)] hover:text-[var(--color-void)] transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.1)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)]"
                            >
                                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                            </button>

                            <button
                                onClick={toggleRepeat}
                                className={`p-1.5 rounded-sm border ${repeat !== 'none' ? 'border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
                                title="Repeat"
                            >
                                {repeat === 'one' ? <Repeat1 size={14} /> : <Repeat size={14} />}
                            </button>

                            <button onClick={next} className="group p-2">
                                <SkipForward size={20} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] transition-colors" />
                            </button>
                        </div>

                        {/* RIGHT: Utilities */}
                        <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end">
                            {/* Favorite */}
                            <button
                                onClick={handleFavoriteClick}
                                className={`p-2 transition-colors ${isFavorite ? 'text-red-500' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
                                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                                <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                            </button>

                            {/* Add to Playlist */}
                            <button
                                onClick={() => setShowPlaylistSelector(true)}
                                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors"
                                title="Add to playlist"
                            >
                                <Plus size={16} />
                            </button>

                            {/* Queue */}
                            <button
                                onClick={() => setShowQueue(!showQueue)}
                                className={`p-2 transition-colors ${showQueue ? 'text-[var(--color-accent-gold)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
                                title="Queue"
                            >
                                <ListMusic size={16} />
                            </button>

                            {/* Volume Control */}
                            <div className="hidden md:flex items-center gap-2 group/vol pl-4 border-l border-[var(--color-border)]">
                                <button
                                    onClick={() => setVolume(volume === 0 ? 0.7 : 0)}
                                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                                >
                                    {volume === 0 ? <VolumeX size={16} /> : volume < 0.5 ? <Volume1 size={16} /> : <Volume2 size={16} />}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                    className="w-16 accent-[var(--color-accent-gold)] h-0.5 bg-[var(--color-text-muted)]/30 rounded-full appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Waveform Scrubber */}
                    <div className="w-full h-10 group flex items-center relative border-t border-[var(--color-border)] pt-4">
                        <BreathingWaveform
                            height={32}
                            color={themeColor}
                            showProgress={true}
                            className="w-full opacity-50 group-hover:opacity-100 transition-opacity"
                        />
                        {/* Time display on hover */}
                        <div className="absolute left-0 -bottom-3 text-[9px] text-[var(--color-text-muted)] font-mono opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                            {formatTime(currentTime)}
                        </div>
                        <div className="absolute right-0 -bottom-3 text-[9px] text-[var(--color-text-muted)] font-mono opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                            {formatTime(duration)}
                        </div>
                    </div>

                </div>
            </div>

            {/* Lyrics Layer (Overlay) */}
            <div className="hidden">
                {/* Future: Full Lyrics Scroll */}
            </div>

            {/* Queue Panel */}
            <QueuePanel isOpen={showQueue} onClose={() => setShowQueue(false)} />

            {/* Playlist Selector */}
            <PlaylistSelector
                isOpen={showPlaylistSelector}
                onClose={() => setShowPlaylistSelector(false)}
                track={currentTrack as Track}
            />

        </div>
    );
}
