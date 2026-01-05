/**
 * Layout - Sacred Proportions
 * 
 * Philosophy: Sidebar : Content = 1 : 1.618 (Golden Ratio)
 * The space between elements is the silence that lets music breathe.
 * 
 * Full-screen experiences (MoodLight, FullscreenPlayer) are portals
 * that consume the entire screen when active.
 */
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { AudioPlayer } from '../player/AudioPlayer';
import { MoodLight } from '../ui/MoodLight';
import { FullscreenPlayer } from '../player/FullscreenPlayer';
import { AudioCanvas } from '../experiences/AudioCanvas';
import { usePlayer } from '../../context/PlayerContext';
import { getTrackCoverUrl } from '../../utils/trackUtils';
import type { Track } from '../../types';

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
        <div className="min-h-screen bg-[var(--bg-deep)]">
            {/* Sidebar - fixed width from CSS var */}
            <Sidebar />

            {/* Navbar */}
            <Navbar />

            {/* Main Content - responsive padding for player */}
            <main className="main-content">
                <Outlet />
            </main>

            {/* Audio Player - Fixed at bottom */}
            {hasPlayer && <AudioPlayer />}

            {/* Full-Screen Portals - These consume the entire screen */}
            <MoodLight
                isVisible={showMoodLight}
                onClose={() => dispatch({ type: 'TOGGLE_MOOD_LIGHT' })}
            />

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

            {/* Audio Canvas - Immersive full-screen music experience */}
            <AudioCanvas
                isOpen={showAudioCanvas}
                onClose={() => dispatch({ type: 'TOGGLE_AUDIO_CANVAS' })}
            />
        </div>
    );
}
