/**
 * Home Page - Forest Clearing at Dusk
 * 
 * Philosophy: The album art is sacred. The visualizer is the hero.
 * Create mystery and emotional impact, not just information display.
 * 
 * "If a user sees this for 3 seconds and leaves, what ONE thing 
 * should they remember?" - The feeling of music becoming visible.
 */
import { useEffect, useState, useRef } from 'react';
import { Play, ArrowRight, Headphones, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MusicCard } from '../components/cards';
import { CymaticsVisualizer, AmbientGlow, VisualizerToggle } from '../components/ui';
import { musicService, podcastService, historyService } from '../services';
import { usePlayer } from '../context/PlayerContext';
import { storage, BUCKETS } from '../lib/appwrite';
import type { Track, Podcast } from '../types';
import type { RecentlyPlayedItem } from '../services/history.service';

export function Home() {
    const { play, isPlaying, currentTrack, setQueue } = usePlayer();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [featured, setFeatured] = useState<Track | null>(null);
    const [podcasts, setPodcasts] = useState<Podcast[]>([]);
    const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [visualizerMode, setVisualizerMode] = useState<'chladni' | 'water' | 'sacred'>('chladni');
    const heroRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const [trackData, podcastData, historyData] = await Promise.all([
                    musicService.getTracks({ limit: 8 }),
                    podcastService.getPodcasts({ limit: 4 }),
                    historyService.getRecentlyPlayed(10),
                ]);
                setTracks(trackData);
                setFeatured(trackData[0] || null);
                setPodcasts(podcastData);
                setRecentlyPlayed(historyData);

                // Set queue for Spotify-like navigation - enables next/previous to work
                if (trackData.length > 0) {
                    setQueue(trackData);
                }
            } catch (error) {
                console.error('Failed to load data:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const featuredCoverUrl = featured?.cover_image_id
        ? storage.getFilePreview(BUCKETS.COVERS, featured.cover_image_id, 600, 600).toString()
        : null;

    return (
        <div className="relative min-h-screen">
            {/* Ambient glow - breathing with music */}
            <AmbientGlow isActive={isPlaying} intensity={0.4} />

            {/* ═══════════════════════════════════════════════════════════════
                HERO SECTION - The First Impression
                Large cymatics visualizer + Featured album art
            ═══════════════════════════════════════════════════════════════ */}
            <section
                ref={heroRef}
                className="relative min-h-[85vh] flex items-center justify-center overflow-hidden"
            >
                {/* Cymatics Visualizer Background - THE HERO */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[min(80vh,80vw)] h-[min(80vh,80vw)]">
                        <CymaticsVisualizer mode={visualizerMode} />
                    </div>
                </div>

                {/* Content Overlay - Hidden when playing to keep visualizer clean */}
                <div className={`relative z-10 text-center px-8 max-w-4xl mx-auto transition-all duration-1000 ${isPlaying ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}>
                    {/* Featured Track Info - Minimal Overlay */}
                    {featured && (
                        <div className="mb-8 animate-in fade-in zoom-in duration-700">
                            <h1 className="text-4xl md:text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-white/80 mb-4 tracking-tight">
                                {featured.title}
                            </h1>
                            <p className="text-xl text-[#d4af37] font-serif italic mb-8">
                                {featured.artist}
                            </p>

                            <button
                                onClick={() => play(featured)}
                                className="inline-flex items-center gap-3 px-8 py-4 bg-[#c9a962] text-[#050505] rounded-full font-semibold text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(201,169,98,0.3)] hover:shadow-[0_0_50px_rgba(201,169,98,0.5)]"
                            >
                                <Play size={24} fill="currentColor" />
                                Play Now
                            </button>
                        </div>
                    )}

                    {/* Visualizer Mode Toggle */}
                    <div className="flex justify-center mb-8">
                        <VisualizerToggle mode={visualizerMode} onModeChange={setVisualizerMode} />
                    </div>

                    {/* Tagline - Mysterious, not corporate */}
                    <p className="text-[#fafaf5]/40 text-sm uppercase tracking-[0.3em] mb-6">
                        Sound made visible
                    </p>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#fafaf5]/30">
                    <span className="text-xs uppercase tracking-widest">Explore</span>
                    <div className="w-px h-8 bg-gradient-to-b from-[#fafaf5]/30 to-transparent" />
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                RECENTLY PLAYED - Continue where you left off
            ═══════════════════════════════════════════════════════════════ */}
            {recentlyPlayed.length > 0 && (
                <section className="py-16 px-8 md:px-12 lg:px-16 bg-[#0d0d0d]">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center gap-3 mb-8">
                            <Clock size={20} className="text-[#c9a962]" />
                            <h2 className="text-xl md:text-2xl font-serif text-[#fafaf5]">
                                Recently Played
                            </h2>
                        </div>

                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {recentlyPlayed.map((item) => (
                                <div
                                    key={item.$id}
                                    className="flex-shrink-0 w-40 p-4 rounded-xl bg-[#111111] border border-white/5 hover:border-[#c9a962]/30 transition-colors cursor-pointer group"
                                >
                                    <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-[#1a1a1a] flex items-center justify-center">
                                        <Headphones size={32} className="text-[#fafaf5]/20 group-hover:text-[#c9a962]/50 transition-colors" />
                                    </div>
                                    <p className="text-xs text-[#fafaf5]/60 truncate">
                                        {item.track_id ? 'Track' : 'Episode'}: {item.track_id || item.episode_id}
                                    </p>
                                    {item.resume_position > 0 && (
                                        <p className="text-xs text-[#c9a962] mt-1">
                                            Resume at {Math.floor(item.resume_position / 60)}:{String(Math.floor(item.resume_position % 60)).padStart(2, '0')}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                RECENT TRACKS - Cards that breathe
            ═══════════════════════════════════════════════════════════════ */}
            <section className="py-24 px-8 md:px-12 lg:px-16">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-end justify-between mb-12">
                        <div>
                            <p className="text-[#4a5e4a] text-xs uppercase tracking-widest mb-2">
                                Collection
                            </p>
                            <h2 className="text-3xl md:text-4xl font-serif text-[#fafaf5]">
                                Recent Discoveries
                            </h2>
                        </div>
                        <Link
                            to="/music"
                            className="hidden md:flex items-center gap-2 text-[#fafaf5]/50 hover:text-[#c9a962] transition-colors"
                        >
                            <span className="text-sm">View All</span>
                            <ArrowRight size={16} />
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="p-5 rounded-2xl bg-[#111111]">
                                    <div className="aspect-square rounded-xl bg-[#1a1a1a] animate-pulse mb-4" />
                                    <div className="h-4 rounded bg-[#1a1a1a] animate-pulse w-3/4 mb-2" />
                                    <div className="h-3 rounded bg-[#1a1a1a] animate-pulse w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {tracks.slice(0, 8).map((track) => (
                                <MusicCard key={track.$id} track={track} />
                            ))}
                        </div>
                    )}

                    {/* Mobile view all link */}
                    <div className="flex justify-center mt-8 md:hidden">
                        <Link
                            to="/music"
                            className="flex items-center gap-2 px-6 py-3 rounded-full border border-[#fafaf5]/10 text-[#fafaf5]/70 hover:border-[#c9a962] hover:text-[#c9a962] transition-colors"
                        >
                            <span>View Library</span>
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                PODCASTS - If available
            ═══════════════════════════════════════════════════════════════ */}
            {podcasts.length > 0 && (
                <section className="py-16 px-8 md:px-12 lg:px-16 bg-[#0d0d0d]">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-end justify-between mb-10">
                            <div>
                                <p className="text-[#4a5e4a] text-xs uppercase tracking-widest mb-2">
                                    Listen
                                </p>
                                <h2 className="text-2xl md:text-3xl font-serif text-[#fafaf5]">
                                    Podcasts
                                </h2>
                            </div>
                            <Link
                                to="/podcasts"
                                className="flex items-center gap-2 text-[#fafaf5]/50 hover:text-[#c9a962] transition-colors"
                            >
                                <span className="text-sm">View All</span>
                                <ArrowRight size={16} />
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                            {podcasts.map((podcast) => (
                                <div
                                    key={podcast.$id}
                                    className="p-4 rounded-xl bg-[#111111] border border-white/5 hover:border-[#c9a962]/20 transition-colors cursor-pointer group"
                                >
                                    <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-[#1a1a1a]">
                                        {podcast.cover_image_id ? (
                                            <img
                                                src={storage.getFilePreview(BUCKETS.COVERS, podcast.cover_image_id, 300, 300).toString()}
                                                alt={podcast.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-4xl">🎙️</span>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-[#fafaf5] truncate text-sm">
                                        {podcast.title}
                                    </h3>
                                    <p className="text-xs text-[#fafaf5]/50 truncate">
                                        {podcast.author}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
