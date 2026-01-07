/**
 * AudioPlayer - Rack Unit Information Processor
 * 
 * Philosophy: High-fidelity audio equipment for the digital age.
 * Aesthetic: Rack-mount hardware, LED displays, physical controls, brushed metal.
 */
import { useState, useRef, useEffect } from 'react';
import {
    Play, Pause, SkipBack, SkipForward,
    Shuffle, Repeat, Repeat1, Volume2, VolumeX,
    Maximize2, ListMusic, Plus,
    Activity
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { BreathingWaveform } from './BreathingWaveform';
import { QueuePanel } from './QueuePanel';
import { PlaylistSelector } from './PlaylistSelector';
import type { Track, Episode } from '../../types';

function formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function isTrack(item: Track | Episode): item is Track {
    return 'artist' in item;
}

export function AudioPlayer() {
    const {
        currentTrack,
        isPlaying,
        progress,
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

    const [showQueue, setShowQueue] = useState(false);
    const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);

    // Resize Logic
    const [width, setWidth] = useState<number>(Math.min(1024, window.innerWidth - 32));
    const [height] = useState<number>(110); // Slightly taller for rack mount ears
    const resizingDirection = useRef<'horizontal' | null>(null);
    const startX = useRef(0);
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
        startWidth.current = width;
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
    };

    if (!currentTrack) return null;

    return (
        <>
            <div
                ref={playerRef}
                style={{ width: `${width}px`, height: `${height}px`, maxWidth: '100vw' }}
                className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] transition-shadow duration-300"
            >
                {/* Rack Unit Chassis */}
                <div className="relative h-full bg-[var(--color-card)] rounded-sm shadow-2xl border-t border-b border-[var(--color-border)] flex flex-col overflow-hidden">
                    {/* Rack Ears (Visual) */}
                    <div className="absolute left-0 top-0 bottom-0 w-3 bg-[var(--color-void)] border-r border-[var(--color-border)] flex flex-col justify-between py-2 items-center z-20">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-primary)] border border-[var(--color-border)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-primary)] border border-[var(--color-border)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" />
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-3 bg-[var(--color-void)] border-l border-[var(--color-border)] flex flex-col justify-between py-2 items-center z-20 cursor-ew-resize group" onMouseDown={(e) => handleResizeStart(e, 'horizontal')}>
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-primary)] border border-[var(--color-border)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] group-hover:border-[var(--color-accent-gold)]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-primary)] border border-[var(--color-border)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] group-hover:border-[var(--color-accent-gold)]" />
                    </div>

                    {/* Top Bevel / Status Bar */}
                    <div className="h-6 bg-[var(--color-void)] border-b border-[var(--color-border)] flex items-center justify-between px-6 select-none">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-gold)] animate-pulse shadow-[0_0_5px_var(--color-accent-gold)]" />
                            <span className="font-mono text-[9px] text-[var(--color-accent-gold)] uppercase tracking-widest">System_Active</span>
                        </div>
                        <div className="font-mono text-[9px] text-[var(--color-text-muted)] uppercase tracking-[0.2em]">High-Fidelity Audio Processor // R-700</div>
                    </div>

                    {/* Main Control Panel */}
                    <div className="flex-1 flex items-center justify-between px-6 gap-6 bg-[var(--color-card)] relative">
                        {/* Texture */}
                        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(90deg, var(--color-border) 1px, transparent 1px)', backgroundSize: '40px 100%' }} />

                        {/* LEFT: Info Display (LCD Style) */}
                        <div className="flex items-center gap-4 flex-1 min-w-0 bg-[var(--color-void)] border border-[var(--color-border)] rounded-sm p-1.5 relative overflow-hidden group">
                            {/* LCD Glow */}
                            <div className="absolute inset-0 bg-[var(--color-accent-gold)]/5 pointer-events-none" />
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.1)_1px,transparent_1px)] bg-[size:100%_3px] pointer-events-none opacity-20" />

                            <div className="w-10 h-10 border border-[var(--color-accent-gold)]/30 bg-[var(--color-accent-gold)]/10 flex items-center justify-center flex-shrink-0">
                                <Activity size={18} className="text-[var(--color-accent-gold)]" />
                            </div>
                            <div className="flex flex-col min-w-0 font-mono">
                                <h4 className="text-[var(--color-accent-gold)] text-xs truncate uppercase tracking-wider glow-text">
                                    {currentTrack.title}
                                </h4>
                                <p className="text-[var(--color-accent-gold)]/60 text-[10px] truncate uppercase">
                                    {isTrack(currentTrack) ? currentTrack.artist : 'Podcast_Unit'}
                                </p>
                            </div>
                        </div>

                        {/* CENTER: Transport Controls (Physical Buttons) */}
                        <div className="flex flex-col items-center gap-2 flex-[1.5] max-w-[400px]">
                            <div className="flex items-center gap-4">
                                <button onClick={toggleShuffle} className={`p-1.5 rounded-sm border ${shuffle ? 'border-[var(--color-accent-gold)] text-[var(--color-accent-gold)] shadow-[0_0_5px_rgba(212,175,55,0.3)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-primary)]'}`}>
                                    <Shuffle size={12} />
                                </button>
                                <button onClick={previous} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors active:translate-y-px">
                                    <SkipBack size={18} />
                                </button>

                                <button
                                    onClick={() => (isPlaying ? pause() : resume())}
                                    className="w-12 h-10 bg-[var(--color-void)] border-t border-b-2 border-l border-r border-[var(--color-border)] rounded-sm flex items-center justify-center text-[var(--color-accent-gold)] hover:bg-[var(--color-card)] hover:border-[var(--color-accent-gold)] hover:text-[var(--color-accent-gold)] hover:shadow-[0_0_10px_rgba(212,175,55,0.2)] transition-all active:border-b active:translate-y-px"
                                >
                                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                                </button>

                                <button onClick={next} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors active:translate-y-px">
                                    <SkipForward size={18} />
                                </button>
                                <button onClick={toggleRepeat} className={`p-1.5 rounded-sm border ${repeat !== 'none' ? 'border-[var(--color-accent-gold)] text-[var(--color-accent-gold)] shadow-[0_0_5px_rgba(212,175,55,0.3)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-primary)]'}`}>
                                    {repeat === 'one' ? <Repeat1 size={12} /> : <Repeat size={12} />}
                                </button>
                            </div>

                            {/* Scrubber / Visualizer Strip */}
                            <div className="w-full h-8 bg-[var(--color-void)] border border-[var(--color-border)] relative group overflow-hidden">
                                <BreathingWaveform
                                    height={32}
                                    color="var(--color-accent-gold)"
                                    showProgress={true}
                                    className="w-full opacity-60 group-hover:opacity-100 transition-opacity"
                                />
                                <div className="absolute right-1 bottom-1 font-mono text-[9px] text-[var(--color-accent-gold)] pointer-events-none">
                                    {formatTime(progress)}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Mixer / Output */}
                        <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
                            {/* Utility Buttons */}
                            <div className="flex items-center gap-2">
                                <button onClick={() => setShowQueue(!showQueue)} className={`text-[var(--color-text-secondary)] hover:text-[var(--color-accent-gold)] transition-colors ${showQueue ? 'text-[var(--color-accent-gold)]' : ''}`}>
                                    <ListMusic size={16} />
                                </button>
                                <button onClick={() => setShowPlaylistSelector(true)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-accent-gold)] transition-colors">
                                    <Plus size={16} />
                                </button>
                            </div>

                            {/* Volume Fader */}
                            <div className="group hidden md:flex items-center gap-2 pl-3 border-l border-[var(--color-border)]">
                                <button onClick={() => setVolume(volume === 0 ? 0.7 : 0)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                                    {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                </button>
                                <div className="w-16 h-1 bg-[var(--color-void)] rounded-full relative">
                                    <div
                                        className="h-full bg-[var(--color-text-secondary)] group-hover:bg-[var(--color-accent-gold)] transition-colors rounded-full"
                                        style={{ width: `${volume * 100}%` }}
                                    />
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={volume}
                                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Expand */}
                            <button onClick={toggleFullscreen} className="ml-2 text-[var(--color-text-secondary)] hover:text-[var(--color-accent-gold)] transition-colors">
                                <Maximize2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Spacer */}
            <div className="h-32" />

            <QueuePanel isOpen={showQueue} onClose={() => setShowQueue(false)} />

            <PlaylistSelector
                isOpen={showPlaylistSelector}
                onClose={() => setShowPlaylistSelector(false)}
                track={currentTrack as Track}
            />
        </>
    );
}
