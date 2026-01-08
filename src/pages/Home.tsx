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
import { Play, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MusicCard } from '../components/cards';
import { CymaticsVisualizer, VisualizerToggle, KineticText } from '../components/ui';
import { musicService, podcastService } from '../services';
import { usePlayer } from '../context/PlayerContext';
import { storage, BUCKETS } from '../lib/appwrite';
import type { Track, Podcast } from '../types';


export function Home() {
    const { play, isPlaying, setQueue } = usePlayer();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [featured, setFeatured] = useState<Track | null>(null);
    const [podcasts, setPodcasts] = useState<Podcast[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [visualizerMode, setVisualizerMode] = useState<'chladni' | 'water' | 'sacred' | 'turing' | 'voronoi' | 'hopf'>('chladni');
    const heroRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const [trackData, podcastData] = await Promise.all([
                    musicService.getTracks({ limit: 8 }),
                    podcastService.getPodcasts({ limit: 4 }),
                ]);
                setTracks(trackData);
                setFeatured(trackData[0] || null);
                setPodcasts(podcastData);

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


    return (
        <div
            className="relative min-h-screen selection:bg-[var(--color-accent-gold)] selection:text-[var(--color-accent-primary)]"
            style={{ backgroundColor: 'var(--color-void)' }}
        >
            {/* Grid Overlay for Technical Feel */}
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
                    backgroundSize: '100px 100px'
                }}
            />

            {/* ═══════════════════════════════════════════════════════════════
                HERO SECTION - Audio Blueprint
            ═══════════════════════════════════════════════════════════════ */}
            <section
                ref={heroRef}
                className="relative h-screen flex items-center justify-center overflow-hidden border-b border-[var(--color-border)]"
            >
                {/* Technical HUD Overlays */}
                <div className="absolute top-0 left-0 w-full h-full p-8 pointer-events-none z-20 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                            <span className="font-mono text-[10px] text-[var(--color-accent-gold)] tracking-widest">SYS.AUDIO_ARCH.V4</span>
                            <span className="font-mono text-[10px] text-[var(--color-text-muted)] tracking-widest">STATUS: ONLINE</span>
                        </div>
                        <div className="font-mono text-[10px] text-[var(--color-text-muted)] tracking-widest text-right">
                            COORD: {tracks.length > 0 ? 'LISTENING' : 'SEARCHING'}
                        </div>
                    </div>
                </div>

                {/* Cymatics Visualizer Background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-40">
                    <div className="w-[min(80vh,80vw)] h-[min(80vh,80vw)] grayscale contrast-125 mix-blend-screen">
                        <CymaticsVisualizer mode={visualizerMode} />
                    </div>
                </div>

                {/* Content Overlay */}
                <div className={`relative z-10 text-center px-8 max-w-5xl mx-auto transition-all duration-1000 ${isPlaying ? 'opacity-0 pointer-events-none blur-sm' : 'opacity-100 blur-0'}`}>
                    {featured && (
                        <div className="mb-12">
                            <div className="inline-flex items-center gap-2 px-3 py-1 border border-[var(--color-accent-gold)]/30 rounded-full mb-6 bg-black/40 backdrop-blur-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-gold)] animate-pulse" />
                                <span className="font-mono text-[10px] text-[var(--color-accent-gold)] tracking-widest uppercase">Now Featured</span>
                            </div>

                            <KineticText
                                text={featured.title}
                                as="h1"
                                type="word"
                                className="text-5xl md:text-7xl lg:text-8xl font-display font-medium text-[var(--color-text-primary)] mb-2 tracking-tighter leading-[0.9]"
                                delay={0}
                                staggerDelay={40}
                            />
                            <KineticText
                                text={featured.artist}
                                as="p"
                                type="char"
                                className="text-xl md:text-2xl font-mono text-[var(--color-text-muted)] uppercase tracking-widest mb-10"
                                delay={600}
                                staggerDelay={30}
                            />

                            <button
                                onClick={() => play(featured)}
                                className="group relative inline-flex items-center gap-4 px-8 py-4 bg-transparent border border-[var(--color-border)] hover:border-[var(--color-accent-gold)] text-[var(--color-text-primary)] transition-all duration-300"
                            >
                                <span className="absolute inset-0 bg-[var(--color-accent-gold)] opacity-0 group-hover:opacity-10 transition-opacity" />
                                <Play size={20} fill="currentColor" className="text-[var(--color-accent-gold)]" />
                                <span className="font-mono text-sm tracking-widest uppercase group-hover:text-[var(--color-accent-gold)] transition-colors">Initialize Playback</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Persistent Visualizer Toggle */}
                <div className="absolute bottom-40 left-1/2 -translate-x-1/2 z-20 transition-all duration-500">
                    <VisualizerToggle mode={visualizerMode} onModeChange={setVisualizerMode} />
                </div>
            </section>


            {/* ═══════════════════════════════════════════════════════════════
                RECENT DISCOVERIES - Main Data Grid
            ═══════════════════════════════════════════════════════════════ */}
            <section className="py-24 px-4 md:px-12 relative">
                <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-[var(--color-border)] left-12 hidden md:block" />

                <div className="max-w-[1800px] mx-auto">
                    <div className="flex items-end justify-between mb-12 ml-0 md:ml-8 border-b border-[var(--color-border)] pb-6">
                        <div className="flex items-center gap-4">
                            <span className="font-mono text-xs text-[var(--color-accent-gold)] border border-[var(--color-accent-gold)]/50 px-2 py-1">01</span>
                            <div>
                                <KineticText
                                    text="Detection Grid"
                                    as="h2"
                                    className="text-3xl font-display text-[var(--color-text-primary)] tracking-tight"
                                />
                                <p className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase mt-1 tracking-widest">
                                    Latest Audio Signals
                                </p>
                            </div>
                        </div>
                        <Link
                            to="/music"
                            className="hidden md:flex items-center gap-2 group"
                        >
                            <span className="font-mono text-xs text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-gold)] transition-colors uppercase tracking-widest">View Database</span>
                            <ArrowRight size={14} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-gold)] transition-colors" />
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 ml-0 md:ml-8">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="aspect-[4/5] bg-[var(--color-void)] animate-pulse rounded-lg border border-[var(--color-border)]" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 ml-0 md:ml-8">
                            {tracks.slice(0, 8).map((track) => (
                                <motion.div
                                    key={track.$id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <MusicCard track={track} />
                                </motion.div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-center mt-12 md:hidden">
                        <Link
                            to="/music"
                            className="px-6 py-3 border border-[var(--color-border)] text-xs font-mono uppercase tracking-widest text-[var(--color-text-primary)] hover:border-[var(--color-accent-gold)] hover:text-[var(--color-accent-gold)] transition-colors"
                        >
                            Access Full Database
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                 PODCASTS - Optional Module
            ═══════════════════════════════════════════════════════════════ */}
            {podcasts.length > 0 && (
                <section className="py-20 px-6 md:px-12 border-t border-[var(--color-border)] bg-[var(--color-void)] relative">
                    <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-[var(--color-border)] left-12 hidden md:block" />

                    <div className="max-w-[1800px] mx-auto">
                        <div className="flex items-center gap-4 mb-10 ml-0 md:ml-8">
                            <span className="font-mono text-xs text-[var(--color-accent-gold)] border border-[var(--color-accent-gold)]/50 px-2 py-1">03</span>
                            <h2 className="text-xl font-display text-[var(--color-text-primary)] tracking-wide">
                                Broadcasts
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 ml-0 md:ml-8">
                            {podcasts.map((podcast) => (
                                <div
                                    key={podcast.$id}
                                    className="group border border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-accent-gold)]/30 transition-colors p-4"
                                >
                                    <div className="aspect-square mb-4 overflow-hidden bg-black border border-[var(--color-border)] group-hover:border-[var(--color-accent-gold)]/20 transition-colors">
                                        {podcast.cover_image_id ? (
                                            <img
                                                src={storage.getFilePreview(BUCKETS.COVERS, podcast.cover_image_id, 300, 300).toString()}
                                                alt={podcast.title}
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 grayscale group-hover:grayscale-0"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-2xl opacity-20">MIC</span>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-display text-sm text-[var(--color-text-primary)] truncate mb-1 group-hover:text-[var(--color-accent-gold)] transition-colors">
                                        {podcast.title}
                                    </h3>
                                    <p className="font-mono text-[10px] text-[var(--color-text-muted)] truncate uppercase tracking-wider">
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
