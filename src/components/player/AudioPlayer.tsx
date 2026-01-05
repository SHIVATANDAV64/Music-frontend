/**
 * AudioPlayer - Minimal controls, maximum visualizer
 * 
 * Philosophy: The player should be minimal and functional.
 * The cymatics visualizer is the hero - the player supports it.
 * Like a frame for art - present but not distracting.
 */
import { useState } from 'react';
import {
    Play, Pause, SkipBack, SkipForward,
    Shuffle, Repeat, Repeat1, Volume2, VolumeX,
    Lightbulb, Maximize2
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { getTrackCoverUrl } from '../../utils/trackUtils';
import { CymaticsVisualizer, VisualizerToggle } from '../ui/CymaticsVisualizer';
import { BreathingWaveform } from './BreathingWaveform';
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
        toggleMoodLight,
        toggleFullscreen,
        showMoodLight,
    } = usePlayer();

    const [visualizerMode, setVisualizerMode] = useState<'chladni' | 'water' | 'sacred'>('chladni');

    if (!currentTrack) return null;

    const coverUrl = isTrack(currentTrack) ? getTrackCoverUrl(currentTrack, 120, 120) : null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100]">
            {/* Ambient glow under player */}
            <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
                style={{
                    background: 'radial-gradient(ellipse at center bottom, rgba(201, 169, 98, 0.15) 0%, transparent 50%)',
                    opacity: isPlaying ? 1 : 0,
                    filter: 'blur(40px)',
                }}
            />

            {/* Player Container */}
            <div className="relative bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/5 shadow-2xl">
                {/* Breathing Waveform - Top of player */}
                <div className="w-full h-[50px] relative z-10">
                    <BreathingWaveform height={50} color="#c9a962" showProgress={true} />
                </div>

                <div className="w-full flex flex-col gap-4 px-4 py-4 md:px-6 md:py-5">
                    {/* Top Row: Track Info + Actions */}
                    <div className="flex items-center gap-4 w-full">
                        {/* Album Art */}
                        <div
                            className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-lg transition-all duration-300"
                            style={{
                                boxShadow: isPlaying
                                    ? '0 0 24px rgba(201, 169, 98, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)'
                                    : '0 4px 12px rgba(0, 0, 0, 0.3)',
                                transform: isPlaying ? 'scale(1.02)' : 'scale(1)',
                            }}
                        >
                            {coverUrl ? (
                                <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] flex items-center justify-center">
                                    <span className="text-xl">🎵</span>
                                </div>
                            )}
                        </div>

                        {/* Track Info */}
                        <div className="flex-1 min-w-0">
                            <h4
                                className="font-semibold text-sm md:text-base truncate transition-colors mb-1"
                                style={{ color: isPlaying ? '#c9a962' : '#fafaf5' }}
                            >
                                {currentTrack.title}
                            </h4>
                            <p className="text-xs md:text-sm text-[#fafaf5]/60 truncate mb-1">
                                {isTrack(currentTrack) ? currentTrack.artist : 'Podcast'}
                            </p>
                            <p className="text-[10px] md:text-xs text-[#fafaf5]/40">
                                {formatTime(progress)} / {formatTime(duration)}
                            </p>
                        </div>

                        {/* Right side actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={toggleMoodLight}
                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                                    showMoodLight 
                                        ? 'text-[#c9a962] bg-[#c9a962]/10' 
                                        : 'text-[#fafaf5]/50 hover:text-[#fafaf5] hover:bg-white/5'
                                }`}
                                title="Mood Light"
                            >
                                <Lightbulb size={18} fill={showMoodLight ? 'currentColor' : 'none'} />
                            </button>

                            <button
                                onClick={toggleFullscreen}
                                className="w-9 h-9 rounded-full flex items-center justify-center text-[#fafaf5]/50 hover:text-[#fafaf5] hover:bg-white/5 transition-all flex-shrink-0"
                                title="Fullscreen Player"
                            >
                                <Maximize2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Visualizer - Full width, prominent */}
                    <div className="w-full h-24 md:h-28 bg-[#161616] rounded-xl overflow-hidden relative border border-white/5">
                        <CymaticsVisualizer mode={visualizerMode} />
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between gap-4 w-full">
                        {/* Left Controls */}
                        <div className="flex items-center gap-2 md:gap-3">
                            <button
                                onClick={toggleShuffle}
                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                    shuffle 
                                        ? 'text-[#c9a962] bg-[#c9a962]/10' 
                                        : 'text-[#fafaf5]/50 hover:text-[#fafaf5] hover:bg-white/5'
                                }`}
                                title="Shuffle"
                            >
                                <Shuffle size={16} />
                            </button>

                            <button
                                onClick={previous}
                                className="w-9 h-9 rounded-full flex items-center justify-center text-[#fafaf5]/70 hover:text-[#fafaf5] hover:bg-white/5 transition-all"
                                title="Previous"
                            >
                                <SkipBack size={18} />
                            </button>

                            <button
                                onClick={() => (isPlaying ? pause() : resume())}
                                className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-[#c9a962] text-[#0a0a0a] shadow-lg transition-all hover:scale-105 active:scale-95"
                                style={{ boxShadow: isPlaying ? '0 0 24px rgba(201, 169, 98, 0.5)' : '0 0 20px rgba(201, 169, 98, 0.3)' }}
                                title={isPlaying ? 'Pause' : 'Play'}
                            >
                                {isPlaying ? (
                                    <Pause size={20} fill="currentColor" />
                                ) : (
                                    <Play size={20} fill="currentColor" className="ml-0.5" />
                                )}
                            </button>

                            <button
                                onClick={next}
                                className="w-9 h-9 rounded-full flex items-center justify-center text-[#fafaf5]/70 hover:text-[#fafaf5] hover:bg-white/5 transition-all"
                                title="Next"
                            >
                                <SkipForward size={18} />
                            </button>

                            <button
                                onClick={toggleRepeat}
                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                    repeat !== 'none' 
                                        ? 'text-[#c9a962] bg-[#c9a962]/10' 
                                        : 'text-[#fafaf5]/50 hover:text-[#fafaf5] hover:bg-white/5'
                                }`}
                                title={`Repeat: ${repeat}`}
                            >
                                {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
                            </button>
                        </div>

                        {/* Center: Visualizer Mode Toggle */}
                        <div className="hidden md:flex flex-shrink-0">
                            <VisualizerToggle mode={visualizerMode} onModeChange={setVisualizerMode} />
                        </div>

                        {/* Right: Volume */}
                        <div className="flex items-center gap-2 md:gap-3">
                            <button
                                onClick={() => setVolume(volume === 0 ? 0.7 : 0)}
                                className="text-[#fafaf5]/60 hover:text-[#fafaf5] transition-colors flex-shrink-0 w-9 h-9 flex items-center justify-center"
                                title={volume === 0 ? 'Unmute' : 'Mute'}
                            >
                                {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="w-20 md:w-24 accent-[#c9a962] h-1.5 cursor-pointer"
                                title={`Volume: ${Math.round(volume * 100)}%`}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
