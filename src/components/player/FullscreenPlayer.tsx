/**
 * Fullscreen Player - Cinematic Glass Experience
 * 
 * Redesigned to prioritize the Visualizer (Sound made visible).
 * Controls are floating in a glass dock at the bottom.
 * Text is elegant and unobtrusive.
 */
import { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Minimize2, Heart, ListMusic, Volume2, Volume1, VolumeX } from 'lucide-react';
import { extractDominantColor } from '../../utils/colorExtractor';
import { getLyrics, type LyricsResult } from '../../services/lyrics.service';
import { CymaticsVisualizer, VisualizerToggle } from '../ui/CymaticsVisualizer';
import { usePlayer } from '../../context/PlayerContext';
import { BreathingWaveform } from './BreathingWaveform';
import { favoritesService } from '../../services/favorites.service';
import { useAuth } from '../../context/AuthContext';
import { QueuePanel } from './QueuePanel';
import { useRef } from 'react';

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

    const [lyrics, setLyrics] = useState<LyricsResult | null>(null);
    const [activeLineIndex, setActiveLineIndex] = useState(-1);
    const [themeColor, setThemeColor] = useState('#d4af37'); // Default gold
    const [visualizerMode, setVisualizerMode] = useState<'chladni' | 'water' | 'sacred'>('sacred');
    const [isFavorite, setIsFavorite] = useState(false);
    const [isAddingFavorite, setIsAddingFavorite] = useState(false);
    const [showQueue, setShowQueue] = useState(false);

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
    useEffect(() => {
        if (!trackName || !artistName || !isVisible) {
            setLyrics(null);
            return;
        }
        getLyrics(trackName, artistName)
            .then(setLyrics)
            .catch(err => console.error('Lyrics fetch failed:', err));
    }, [trackName, artistName, isVisible]);

    // Sync Lyrics
    useEffect(() => {
        if (!lyrics?.syncedLyrics) return;
        const lines = lyrics.syncedLyrics;
        let idx = -1;
        for (let i = lines.length - 1; i >= 0; i--) {
            if (currentTime >= lines[i].time) {
                idx = i;
                break;
            }
        }
        setActiveLineIndex(idx);
    }, [currentTime, lyrics]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[200] flex flex-col animate-in fade-in duration-500 bg-black overflow-hidden font-sans">

            {/* 1. LAYER: VISUALIZER (The Hero) */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 transition-opacity duration-1000">
                    <CymaticsVisualizer mode={visualizerMode} />
                </div>
                {/* Subtle vignette, not a heavy gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
            </div>

            {/* 2. LAYER: TOP BAR (Header) */}
            <div className="relative z-50 w-full p-6 md:p-8 flex justify-between items-start">
                {/* Visualizer Toggle */}
                <div className="backdrop-blur-md bg-black/20 rounded-full p-1 border border-white/10">
                    <VisualizerToggle mode={visualizerMode} onModeChange={setVisualizerMode} />
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="group flex flex-col items-center gap-1 text-white/50 hover:text-white transition-colors"
                >
                    <div className="w-12 h-12 rounded-full backdrop-blur-md bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
                        <Minimize2 size={20} />
                    </div>
                </button>
            </div>

            {/* 3. LAYER: CENTER STAGE (Lyrics / Metadata) */}
            <div className="relative z-40 flex-1 flex flex-col items-center justify-center text-center px-4 -mt-20">

                {/* Metadata */}
                <div className="mb-12 space-y-2">
                    <h2 className="text-2xl md:text-3xl font-semibold text-white/90 tracking-tight drop-shadow-lg">
                        {trackName || 'Unknown Track'}
                    </h2>
                    <p className="text-lg text-[#d4af37]/80 font-medium tracking-wide drop-shadow-md">
                        {artistName || 'Unknown Artist'}
                    </p>
                </div>

                {/* Lyrics Highlight */}
                <div className="h-24 flex items-center justify-center">
                    {lyrics?.syncedLyrics && activeLineIndex !== -1 ? (
                        <p className="text-2xl md:text-3xl text-white/90 font-medium animate-in slide-in-from-bottom-2 fade-in duration-300 drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
                            {lyrics.syncedLyrics[activeLineIndex].text}
                        </p>
                    ) : (
                        <p className="text-white/40 italic flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-current" />
                            Sound made visible
                            <span className="w-1 h-1 rounded-full bg-current" />
                        </p>
                    )}
                </div>
            </div>

            {/* 4. LAYER: BOTTOM DOCK (Controls) */}
            <div className="relative z-50 w-full pb-12 px-6 md:px-12 flex flex-col items-center">

                {/* Glass Dock Container */}
                <div
                    ref={dockRef}
                    style={{ width: `${width}px`, height: `${height}px`, maxWidth: '100vw' }}
                    className="relative backdrop-blur-xl bg-black/40 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl ring-1 ring-white/5 flex flex-col justify-center"
                >
                    {/* Resize Handles */}
                    {/* Vertical (Top) */}
                    <div
                        onMouseDown={(e) => handleResizeStart(e, 'top')}
                        className="absolute left-10 right-10 -top-1 h-3 cursor-ns-resize z-50 flex items-center justify-center group/handle transition-opacity"
                        title="Drag to resize height"
                    >
                        <div className="w-16 h-1 rounded-full bg-white/20 group-hover/handle:bg-[#d4af37] shadow-lg" />
                    </div>

                    {/* Horizontal (Right) */}
                    <div
                        onMouseDown={(e) => handleResizeStart(e, 'right')}
                        className="absolute -right-1 top-10 bottom-10 w-3 cursor-ew-resize z-50 flex items-center justify-center group/handle transition-opacity"
                        title="Drag to resize width"
                    >
                        <div className="w-1 h-12 rounded-full bg-white/20 group-hover/handle:bg-[#d4af37] shadow-lg" />
                    </div>

                    {/* Horizontal (Left) */}
                    <div
                        onMouseDown={(e) => handleResizeStart(e, 'left')}
                        className="absolute -left-1 top-10 bottom-10 w-3 cursor-ew-resize z-50 flex items-center justify-center group/handle transition-opacity"
                    >
                        <div className="w-1 h-12 rounded-full bg-white/20 group-hover/handle:bg-[#d4af37] shadow-lg" />
                    </div>

                    {/* Scrubber Row */}
                    <div className="flex items-center gap-4 mb-6">
                        <span className="text-xs font-mono text-white/50 w-10 text-right">
                            {formatTime(currentTime)}
                        </span>

                        {/* Interactive Waveform Scrubber */}
                        <div className="flex-1 h-12 relative group">
                            <BreathingWaveform
                                height={48}
                                color={themeColor}
                                showProgress={true}
                                className="opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                        </div>

                        <span className="text-xs font-mono text-white/50 w-10">
                            {formatTime(duration)}
                        </span>
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between px-2 md:px-6">

                        <div className="flex items-center gap-2 md:gap-4">
                            {/* Shuffle */}
                            <button
                                onClick={toggleShuffle}
                                className={`p-2 rounded-full transition-colors ${shuffle ? 'text-[#d4af37] bg-[#d4af37]/10' : 'text-white/40 hover:text-white'}`}
                                title="Shuffle"
                            >
                                <Shuffle size={20} />
                            </button>

                            {/* Favorite */}
                            <button
                                onClick={handleFavoriteClick}
                                className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-red-500 bg-red-500/10' : 'text-white/40 hover:text-white'}`}
                                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                                <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                            </button>
                        </div>

                        {/* Transport */}
                        <div className="flex items-center gap-6 md:gap-8">
                            <button onClick={previous} className="text-white/70 hover:text-white transition-all hover:scale-110">
                                <SkipBack size={32} fill="currentColor" className="opacity-50" />
                            </button>

                            <button
                                onClick={isPlaying ? pause : resume}
                                className="w-16 h-16 rounded-full bg-[#d4af37] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                            >
                                {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                            </button>

                            <button onClick={next} className="text-white/70 hover:text-white transition-all hover:scale-110">
                                <SkipForward size={32} fill="currentColor" className="opacity-50" />
                            </button>
                        </div>

                        {/* Repeat & Queue */}
                        <div className="flex items-center gap-2 md:gap-4">
                            {/* Queue */}
                            <button
                                onClick={() => setShowQueue(!showQueue)}
                                className={`p-2 rounded-full transition-colors ${showQueue ? 'text-[#d4af37] bg-[#d4af37]/10' : 'text-white/40 hover:text-white'}`}
                                title="Queue"
                            >
                                <ListMusic size={20} />
                            </button>

                            {/* Repeat */}
                            <button
                                onClick={toggleRepeat}
                                className={`p-2 rounded-full transition-colors ${repeat !== 'none' ? 'text-[#d4af37] bg-[#d4af37]/10' : 'text-white/40 hover:text-white'}`}
                                title="Repeat"
                            >
                                {repeat === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
                            </button>

                            {/* Volume Control */}
                            <div className="flex items-center gap-2 group/vol">
                                <button
                                    onClick={() => setVolume(volume === 0 ? 0.7 : 0)}
                                    className="text-white/40 hover:text-white transition-colors"
                                >
                                    {volume === 0 ? <VolumeX size={20} /> : volume < 0.5 ? <Volume1 size={20} /> : <Volume2 size={20} />}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                    className="w-0 group-hover/vol:w-24 transition-all duration-300 opacity-0 group-hover/vol:opacity-100 accent-[#d4af37] h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                                />
                            </div>
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

        </div>
    );
}
