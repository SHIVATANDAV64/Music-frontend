/**
 * Lyrics Component
 * Displays synchronized lyrics with auto-scroll and font controls.
 * Based on soulmate-mono's Lyrics.tsx
 */

import { useState, useEffect, useRef } from 'react';
import { getLyrics, type LyricsResult } from '../../services/lyrics.service';
import { Music, Type, AlignLeft, AlignCenter, AlignRight, Maximize2, Minimize2 } from 'lucide-react';

interface LyricsProps {
    trackName: string | null;
    artistName: string | null;
    currentTime: number;
    isVisible?: boolean;
}

export function Lyrics({ trackName, artistName, currentTime, isVisible = true }: LyricsProps) {
    const [lyrics, setLyrics] = useState<LyricsResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeLineIndex, setActiveLineIndex] = useState(-1);
    const [fontSize, setFontSize] = useState(1); // Scale: 0.6 to 1.8
    const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('center');
    const [isExpanded, setIsExpanded] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const activeLineRef = useRef<HTMLDivElement>(null);

    // Fetch lyrics when track changes
    useEffect(() => {
        if (!trackName || !artistName) {
            setLyrics(null);
            return;
        }

        const fetchLyrics = async () => {
            setIsLoading(true);
            setError(null);
            setActiveLineIndex(-1);

            try {
                const result = await getLyrics(trackName, artistName);
                setLyrics(result);
                if (!result) {
                    setError('Lyrics not found');
                }
            } catch (err) {
                console.error('Failed to fetch lyrics:', err);
                setError('Failed to load lyrics');
            } finally {
                setIsLoading(false);
            }
        };

        fetchLyrics();
    }, [trackName, artistName]);

    // Update active line based on current time
    useEffect(() => {
        if (!lyrics?.syncedLyrics) return;

        const lines = lyrics.syncedLyrics;
        let newActiveIndex = -1;

        for (let i = lines.length - 1; i >= 0; i--) {
            if (currentTime >= lines[i].time) {
                newActiveIndex = i;
                break;
            }
        }

        if (newActiveIndex !== activeLineIndex) {
            setActiveLineIndex(newActiveIndex);
        }
    }, [currentTime, lyrics, activeLineIndex]);

    // Auto-scroll to active line
    useEffect(() => {
        if (activeLineRef.current && containerRef.current) {
            activeLineRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [activeLineIndex]);

    if (!isVisible) return null;

    const increaseFontSize = () => setFontSize(prev => Math.min(prev + 0.2, 1.8));
    const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 0.2, 0.6));

    return (
        <div
            className={`lyrics-panel ${isExpanded ? 'expanded' : ''}`}
            style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--space-13)',
                border: '1px solid var(--gold-muted)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: isExpanded ? '80vh' : '300px',
                transition: 'height 0.3s ease',
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: 'var(--space-13)',
                    borderBottom: '1px solid var(--gold-muted)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <h3 style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    margin: 0,
                }}>
                    Lyrics
                </h3>

                <div style={{ display: 'flex', gap: 'var(--space-5)' }}>
                    {/* Font size controls */}
                    <button
                        onClick={decreaseFontSize}
                        disabled={fontSize <= 0.6}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: fontSize <= 0.6 ? 0.3 : 1 }}
                        title="Decrease font size"
                    >
                        <Type size={14} />
                    </button>
                    <button
                        onClick={increaseFontSize}
                        disabled={fontSize >= 1.8}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: fontSize >= 1.8 ? 0.3 : 1 }}
                        title="Increase font size"
                    >
                        <Type size={18} />
                    </button>

                    {/* Alignment */}
                    <button
                        onClick={() => setAlignment('left')}
                        style={{ background: 'none', border: 'none', color: alignment === 'left' ? 'var(--gold)' : 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                        <AlignLeft size={16} />
                    </button>
                    <button
                        onClick={() => setAlignment('center')}
                        style={{ background: 'none', border: 'none', color: alignment === 'center' ? 'var(--gold)' : 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                        <AlignCenter size={16} />
                    </button>
                    <button
                        onClick={() => setAlignment('right')}
                        style={{ background: 'none', border: 'none', color: alignment === 'right' ? 'var(--gold)' : 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                        <AlignRight size={16} />
                    </button>

                    {/* Expand */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                        {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div
                ref={containerRef}
                style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: 'var(--space-21)',
                    textAlign: alignment,
                }}
            >
                {/* No track selected */}
                {!trackName && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'var(--text-muted)',
                        gap: 'var(--space-8)',
                    }}>
                        <Music size={48} strokeWidth={1} style={{ opacity: 0.3 }} />
                        <p>Select a track to view lyrics</p>
                    </div>
                )}

                {/* Loading */}
                {trackName && isLoading && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'var(--text-secondary)',
                    }}>
                        Loading lyrics...
                    </div>
                )}

                {/* Error */}
                {trackName && error && !isLoading && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'var(--text-muted)',
                        gap: 'var(--space-8)',
                    }}>
                        <Music size={48} strokeWidth={1} style={{ opacity: 0.3 }} />
                        <p>{error}</p>
                    </div>
                )}

                {/* Instrumental */}
                {lyrics?.instrumental && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'var(--text-muted)',
                    }}>
                        <Music size={48} strokeWidth={1} style={{ opacity: 0.3 }} />
                        <p>Instrumental track</p>
                    </div>
                )}

                {/* Synced Lyrics */}
                {lyrics?.syncedLyrics && lyrics.syncedLyrics.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
                        {lyrics.syncedLyrics.map((line, index) => (
                            <div
                                key={index}
                                ref={index === activeLineIndex ? activeLineRef : null}
                                style={{
                                    fontSize: `${fontSize}em`,
                                    fontWeight: index === activeLineIndex ? 600 : 400,
                                    color: index === activeLineIndex
                                        ? 'var(--gold)'
                                        : index < activeLineIndex
                                            ? 'var(--text-muted)'
                                            : 'var(--text-secondary)',
                                    transform: index === activeLineIndex ? `scale(${1 + fontSize * 0.05})` : 'scale(1)',
                                    transition: 'all 0.3s ease',
                                    lineHeight: 1.6,
                                }}
                            >
                                {line.text}
                            </div>
                        ))}
                    </div>
                )}

                {/* Plain Lyrics (no sync) */}
                {lyrics && !lyrics.syncedLyrics && lyrics.plainLyrics && (
                    <div style={{
                        whiteSpace: 'pre-wrap',
                        fontSize: `${fontSize * 0.9}em`,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.8,
                    }}>
                        {lyrics.plainLyrics}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Lyrics;
