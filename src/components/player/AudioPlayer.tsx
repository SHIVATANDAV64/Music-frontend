/**
 * AudioPlayer - Organic Floating Dock
 * 
 * Philosophy: A tactile, physical object that rests on the screen.
 * Not a digital bar, but a control surface.
 */
import { useState } from 'react';
import {
    Play, Pause, SkipBack, SkipForward,
    Shuffle, Repeat, Repeat1, Volume2, VolumeX,
    Maximize2, ListMusic, Plus
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { VisualizerToggle } from '../ui/CymaticsVisualizer';
import { BreathingWaveform } from './BreathingWaveform';
import { QueuePanel } from './QueuePanel';
import { PlaylistSelector } from './PlaylistSelector';
import { useRef, useEffect } from 'react';
import type { Track, Episode } from '../../types';

function formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function isTrack(item: Track | Episode): item is Track {
    return 'artist' in item;
}

export function AudioPlayer() {
    const {
        currentTrack,
        isPlaying,
        progress,
        duration,
        volume,
        shuffle,
        repeat,
        pause,
        resume,
        setVolume,
        next,
        previous,
        toggleShuffle,
        toggleRepeat,
        toggleFullscreen,
    } = usePlayer();

    const [visualizerMode, setVisualizerMode] = useState<'chladni' | 'water' | 'sacred' | 'turing' | 'voronoi' | 'hopf'>('chladni');
    const [showQueue, setShowQueue] = useState(false);
    const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);

    // Resize Logic
    const [width, setWidth] = useState<number>(Math.min(1024, window.innerWidth - 32));
    const [height] = useState<number>(96); // Fixed height to prevent vertical movement confusion
    const resizingDirection = useRef<'horizontal' | null>(null);
    const startX = useRef(0);
    const startY = useRef(0);
    const startWidth = useRef(0);
    const playerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleMouseMove(e: MouseEvent) {
            if (!resizingDirection.current) return;

            if (resizingDirection.current === 'horizontal') {
                const delta = (e.clientX - startX.current) * 2;
                const newWidth = Math.max(320, Math.min(window.innerWidth - 32, startWidth.current + delta));
                setWidth(newWidth);
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

    const handleResizeStart = (e: React.MouseEvent, direction: 'horizontal') => {
        e.preventDefault();
        e.stopPropagation();
        resizingDirection.current = direction;

        startX.current = e.clientX;
        startY.current = e.clientY;
        startWidth.current = width;

        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
    };

    if (!currentTrack) return null;


    // Calculate progress percentage for the organic fill effect
    const progressPercent = duration ? (progress / duration) * 100 : 0;

    return (
        <>
            {/* 
              Floating Dynamic Dock 
              Positioned at bottom center, floating above content.
            */}
            <div
                ref={playerRef}
                style={{ width: `${width}px`, height: `${height}px`, maxWidth: '100vw' }}
                className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] transition-shadow duration-300 ease-out"
            >
                {/* Main Card Surface */}
                <div className="relative bg-[#161616] rounded-[24px] shadow-paper border border-[#ffffff]/5 overflow-hidden backdrop-blur-md">

                    {/* Resize Handle (Right Edge) */}
                    <div
                        onMouseDown={(e) => handleResizeStart(e, 'horizontal')}
                        className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize z-50 hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-center group/handle"
                        title="Drag to resize width"
                    >
                        <div className="w-1 h-8 rounded-full bg-white/10 group-hover/handle:bg-white/30 transition-colors" />
                    </div>
                    {/* Resize Handle (Left Edge) */}
                    <div
                        onMouseDown={(e) => handleResizeStart(e, 'horizontal')}
                        className="absolute left-0 top-0 bottom-0 w-4 cursor-ew-resize z-50 hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-center group/handle"
                    >
                        <div className="w-1 h-8 rounded-full bg-white/10 group-hover/handle:bg-white/30 transition-colors" />
                    </div>

                    {/* Background Texture Overlay */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
                    />

                    {/* Subtle Progress Fill (Bottom) */}
                    <div
                        className="absolute bottom-0 left-0 h-[2px] bg-[#d4af37] transition-all duration-300 ease-linear opacity-50"
                        style={{ width: `${progressPercent}%` }}
                    />

                    {/* 
                       Internal Grid Layout 
                       Three sections: Info (Left), Controls (Center), Extra (Right)
                    */}
                    <div className="relative flex items-center justify-between px-4 py-3 md:px-6 md:py-4 gap-4 h-full">

                        {/* LEFT: Track Info & Art */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">


                            <div className="flex flex-col min-w-0">
                                <h4 className="text-[#e6e6e6] text-sm font-medium truncate font-sans tracking-wide">
                                    {currentTrack.title}
                                </h4>
                                <p className="text-[#999] text-xs truncate font-serif italic">
                                    {isTrack(currentTrack) ? currentTrack.artist : 'Podcast'}
                                </p>
                            </div>
                        </div>

                        {/* CENTER: Organic Controls */}
                        <div className="flex flex-col items-center gap-2 flex-[2] max-w-[320px]">
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={previous}
                                    className="text-[#999] hover:text-[#e6e6e6] transition-colors p-2"
                                >
                                    <SkipBack size={20} className="hover:scale-110 transition-transform" />
                                </button>

                                <button
                                    onClick={toggleShuffle}
                                    className={`transition-colors ${shuffle ? 'text-[#d4af37]' : 'text-[#999] hover:text-[#e6e6e6]'}`}
                                    title="Shuffle"
                                >
                                    <Shuffle size={16} />
                                </button>

                                <button
                                    onClick={() => (isPlaying ? pause() : resume())}
                                    className="w-12 h-12 rounded-full bg-[#d4af37] text-[#0e0e0e] flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-300"
                                >
                                    {isPlaying ? (
                                        <Pause size={20} fill="currentColor" />
                                    ) : (
                                        <Play size={20} fill="currentColor" className="ml-0.5" />
                                    )}
                                </button>

                                <button
                                    onClick={toggleRepeat}
                                    className={`transition-colors ${repeat !== 'none' ? 'text-[#d4af37]' : 'text-[#999] hover:text-[#e6e6e6]'}`}
                                    title="Repeat"
                                >
                                    {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
                                </button>

                                <button
                                    onClick={next}
                                    className="text-[#999] hover:text-[#e6e6e6] transition-colors p-2"
                                >
                                    <SkipForward size={20} className="hover:scale-110 transition-transform" />
                                </button>
                            </div>

                            {/* Interactive Visualizer Scrubber */}
                            <div className="w-full h-12 group flex items-center relative">
                                {/* The Waveform IS the visualizer + scrubber */}
                                <BreathingWaveform
                                    height={40}
                                    color="#d4af37"
                                    showProgress={true}
                                    className="w-full opacity-60 group-hover:opacity-100 transition-opacity"
                                />

                                {/* Time Tooltip */}
                                <div className="absolute right-0 -bottom-4 text-[9px] text-[#555] opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                                    {formatTime(progress)} / {formatTime(duration)}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Volume & Tools */}
                        <div className="flex items-center gap-4 flex-1 justify-end min-w-0">
                            {/* Visualizer Mode Mini-Toggle */}
                            <div className="hidden md:block">
                                <VisualizerToggle mode={visualizerMode} onModeChange={setVisualizerMode} />
                            </div>

                            <button
                                onClick={toggleFullscreen}
                                className="text-[#999] hover:text-[#d4af37] transition-colors p-2"
                                title="Expand"
                            >
                                <Maximize2 size={18} />
                            </button>

                            {/* Add to Playlist */}
                            <button
                                onClick={() => setShowPlaylistSelector(true)}
                                className="p-2 text-[#999] hover:text-[#d4af37] transition-colors"
                                title="Add to Playlist"
                            >
                                <Plus size={18} />
                            </button>

                            {/* Queue Toggle */}
                            <button
                                onClick={() => setShowQueue(!showQueue)}
                                className={`p-2 transition-colors ${showQueue ? 'text-[#d4af37]' : 'text-[#999] hover:text-[#d4af37]'}`}
                                title="Queue"
                            >
                                <ListMusic size={18} />
                            </button>

                            {/* Volume */}
                            <div className="group hidden md:flex items-center gap-2">
                                <button
                                    onClick={() => setVolume(volume === 0 ? 0.7 : 0)}
                                    className="text-[#999] hover:text-[#e6e6e6]"
                                >
                                    {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                </button>
                                <div className="w-0 overflow-hidden group-hover:w-20 transition-all duration-300">
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={volume}
                                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                                        className="w-20 h-1 accent-[#d4af37] cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Integrated Breathing Visualizer (Subtle Background) */}
                    <div className="absolute bottom-0 left-0 right-0 h-[40px] opacity-20 pointer-events-none z-0 mix-blend-plus-lighter">
                        <BreathingWaveform height={40} color="#d4af37" showProgress={false} />
                    </div>
                </div>
            </div>

            {/* Spacer to prevent content from being hidden behind the dock. */}
            <div className="h-32" />

            {/* Queue Panel */}
            <QueuePanel isOpen={showQueue} onClose={() => setShowQueue(false)} />

            {/* Playlist Selector */}
            <PlaylistSelector
                isOpen={showPlaylistSelector}
                onClose={() => setShowPlaylistSelector(false)}
                track={currentTrack as Track}
            />
        </>
    );
}
