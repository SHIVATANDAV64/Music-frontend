/**
 * Layout - Audio Architecture Shell
 * 
 * Philosophy: The "Void" container. Dark, infinite, precise.
 * Provides the grid and structure for all chaotic elements.
 */
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { AudioPlayer } from '../player/AudioPlayer';
import { MoodLight } from '../ui/MoodLight';
import { FullscreenPlayer } from '../player/FullscreenPlayer';
import { AudioCanvas } from '../experiences/AudioCanvas';
import { Footer } from './Footer';
import { usePlayer } from '../../context/PlayerContext';
import { getTrackCoverUrl } from '../../utils/trackUtils';
import type { Track } from '../../types';
import { useState, useEffect } from 'react';

export function Layout() {
    const {
        currentTrack,
        showMoodLight,
        showFullscreen,
        showAudioCanvas,
        dispatch,
        currentTime,
        duration,
        isPlaying
    } = usePlayer();
    const hasPlayer = currentTrack !== null;
    const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileSidebarOpen(false);
    }, [window.location.pathname]);

    // Source-aware album art URL
    const albumArt = currentTrack && 'source' in currentTrack
        ? getTrackCoverUrl(currentTrack as Track, 600, 600)
        : null;

    // Get artist name (Track has artist, Episode might have author)
    const getArtistName = () => {
        if (!currentTrack) return null;
        if ('artist' in currentTrack) return currentTrack.artist;
        if ('author' in currentTrack) return currentTrack.author as string;
        return null;
    };

    return (
        <div
            className="min-h-screen relative font-body transition-colors duration-300"
            style={{
                backgroundColor: 'var(--color-void)',
                color: 'var(--color-text-primary)'
            }}
        >
            {/* 
                GLOBAL GRID OVERLAY 
                Mathematical foundation for the entire app.
            */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.4]"
                style={{
                    backgroundImage: `linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)`,
                    backgroundSize: '100px 100px'
                }}
            />

            {/* Top Noise/Grain texture for analog feel */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-[1] mix-blend-overlay bg-noise" />

            {/* Sidebar - Pass mobile state */}
            <Sidebar
                mobileOpen={isMobileSidebarOpen}
                onMobileClose={() => setMobileSidebarOpen(false)}
            />

            {/* Navbar - Pass toggle handler */}
            <Navbar onMenuClick={() => setMobileSidebarOpen(true)} />

            {/* Main Content Area */}
            <main
                className="relative z-10 pt-20 transition-all duration-300 min-h-screen flex flex-col md:ml-[var(--sidebar-width,280px)] ml-0"
                style={{
                    paddingBottom: hasPlayer ? '120px' : '40px'
                }}
            >
                <div className="flex-1">
                    <Outlet />
                </div>

                <Footer />
            </main>

            {/* Audio Player - Docked at bottom */}
            {hasPlayer && <AudioPlayer />}

            {/* 
                PORTALS & LAYERS 
                These exist outside the standard flow.
            */}

            {/* Mood Light - Ambient Overlay */}
            <MoodLight
                isVisible={showMoodLight}
                onClose={() => dispatch({ type: 'TOGGLE_MOOD_LIGHT' })}
            />

            {/* Fullscreen Player - The "Focus" Mode */}
            <FullscreenPlayer
                isVisible={showFullscreen}
                onClose={() => dispatch({ type: 'TOGGLE_FULLSCREEN' })}
                trackName={currentTrack?.title || null}
                artistName={getArtistName()}
                albumArt={albumArt}
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
            />

            {/* Audio Canvas - Pure Experience */}
            <AudioCanvas
                isOpen={showAudioCanvas}
                onClose={() => dispatch({ type: 'TOGGLE_AUDIO_CANVAS' })}
            />
        </div >
    );
}
