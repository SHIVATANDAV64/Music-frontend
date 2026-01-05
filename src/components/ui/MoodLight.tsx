/**
 * MoodLight Component
 * Fullscreen ambient lighting with 5 mood presets.
 * Based on soulmate-mono's MoodLight.tsx
 */

import { useState, useEffect } from 'react';
import { X, Settings, Zap, Clock, Heart, PartyPopper, CloudRain, Flame, Sparkles } from 'lucide-react';

interface MoodLightProps {
    isVisible: boolean;
    onClose: () => void;
}

const moods = [
    {
        name: 'Party',
        icon: PartyPopper,
        colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'],
        preview: '#FF0000'
    },
    {
        name: 'Love',
        icon: Heart,
        colors: ['#FF1744', '#E91E63', '#FF4081', '#F50057', '#C2185B', '#AD1457'],
        preview: '#FF1744'
    },
    {
        name: 'Sad',
        icon: CloudRain,
        colors: ['#1A237E', '#283593', '#303F9F', '#3949AB', '#3F51B5', '#5C6BC0'],
        preview: '#1A237E'
    },
    {
        name: 'Energy',
        icon: Flame,
        colors: ['#FF6D00', '#FF9100', '#FFAB00', '#FFC400', '#FFD600', '#FFEA00'],
        preview: '#FF6D00'
    },
    {
        name: 'Dream',
        icon: Sparkles,
        colors: ['#7C4DFF', '#B388FF', '#EA80FC', '#E040FB', '#D500F9', '#AA00FF'],
        preview: '#7C4DFF'
    },
];

export function MoodLight({ isVisible, onClose }: MoodLightProps) {
    const [currentMood, setCurrentMood] = useState(moods[0]);
    const [currentColorIndex, setCurrentColorIndex] = useState(0);
    const [speed, setSpeed] = useState(500);
    const [transition, setTransition] = useState(0.3);
    const [showControls, setShowControls] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

    // Auto-hide controls after 3 seconds
    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;

        const handleMouseMove = () => {
            setShowControls(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (!showSettings) setShowControls(false);
            }, 3000);
        };

        if (isVisible) {
            window.addEventListener('mousemove', handleMouseMove);
            timeout = setTimeout(() => setShowControls(false), 3000);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(timeout);
        };
    }, [isVisible, showSettings]);

    // Color cycling
    useEffect(() => {
        if (!isVisible) return;

        const interval = setInterval(() => {
            setCurrentColorIndex((prev) => (prev + 1) % currentMood.colors.length);
        }, speed);

        return () => clearInterval(interval);
    }, [isVisible, currentMood, speed]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isVisible) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    const currentColor = currentMood.colors[currentColorIndex];
    const IconComponent = currentMood.icon;

    return (
        <div
            className="mood-light-overlay"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: currentColor,
                transition: `background-color ${transition}s ease`
            }}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: 24,
                    right: 24,
                    padding: 14,
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: 'rgba(0,0,0,0.25)',
                    backdropFilter: 'blur(12px)',
                    opacity: showControls ? 1 : 0,
                    transform: showControls ? 'translateY(0)' : 'translateY(-16px)',
                    transition: 'all 0.3s ease'
                }}
            >
                <X size={22} color="white" />
            </button>

            {/* Center Icon */}
            <div style={{
                opacity: showControls ? 0.2 : 0.08,
                transition: 'opacity 0.5s ease',
                filter: 'drop-shadow(0 0 80px rgba(255,255,255,0.4))'
            }}>
                <IconComponent size={180} color="white" strokeWidth={1} />
            </div>

            {/* Bottom Controls */}
            <div style={{
                position: 'absolute',
                bottom: 32,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                opacity: showControls ? 1 : 0,
                transition: 'all 0.3s ease'
            }}>

                {/* Settings Panel */}
                {showSettings && (
                    <div style={{
                        padding: 24,
                        borderRadius: 20,
                        width: 280,
                        backgroundColor: 'rgba(0,0,0,0.35)',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                        <div style={{
                            textAlign: 'center',
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'rgba(255,255,255,0.5)',
                            textTransform: 'uppercase',
                            letterSpacing: 2,
                            marginBottom: 20
                        }}>
                            {currentMood.name} Mode
                        </div>

                        {/* Speed Control */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 10,
                                color: 'white',
                                fontSize: 13
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.8 }}>
                                    <Zap size={14} /> Speed
                                </span>
                                <span style={{ fontFamily: 'monospace', fontSize: 11, opacity: 0.5 }}>{speed}ms</span>
                            </div>
                            <input
                                type="range"
                                min="50"
                                max="2000"
                                step="50"
                                value={speed}
                                onChange={(e) => setSpeed(Number(e.target.value))}
                                style={{
                                    width: '100%',
                                    height: 4,
                                    borderRadius: 2,
                                    appearance: 'none',
                                    cursor: 'pointer',
                                    background: `linear-gradient(to right, white ${((speed - 50) / 1950) * 100}%, rgba(255,255,255,0.15) ${((speed - 50) / 1950) * 100}%)`
                                }}
                            />
                        </div>

                        {/* Transition Control */}
                        <div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 10,
                                color: 'white',
                                fontSize: 13
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.8 }}>
                                    <Clock size={14} /> Transition
                                </span>
                                <span style={{ fontFamily: 'monospace', fontSize: 11, opacity: 0.5 }}>{transition}s</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={transition}
                                onChange={(e) => setTransition(Number(e.target.value))}
                                style={{
                                    width: '100%',
                                    height: 4,
                                    borderRadius: 2,
                                    appearance: 'none',
                                    cursor: 'pointer',
                                    background: `linear-gradient(to right, white ${(transition / 2) * 100}%, rgba(255,255,255,0.15) ${(transition / 2) * 100}%)`
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Mood Selector */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: 8,
                    borderRadius: 50,
                    backgroundColor: 'rgba(0,0,0,0.25)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255,255,255,0.08)'
                }}>
                    {moods.map((mood) => {
                        const MoodIcon = mood.icon;
                        const isActive = currentMood.name === mood.name;
                        return (
                            <button
                                key={mood.name}
                                onClick={() => {
                                    setCurrentMood(mood);
                                    setCurrentColorIndex(0);
                                }}
                                title={mood.name}
                                style={{
                                    padding: 14,
                                    borderRadius: '50%',
                                    border: 'none',
                                    cursor: 'pointer',
                                    backgroundColor: isActive ? mood.preview : 'transparent',
                                    boxShadow: isActive ? `0 0 24px ${mood.preview}` : 'none',
                                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <MoodIcon
                                    size={18}
                                    color="white"
                                    fill={isActive ? 'white' : 'none'}
                                />
                            </button>
                        );
                    })}

                    <div style={{
                        width: 1,
                        height: 28,
                        margin: '0 8px',
                        backgroundColor: 'rgba(255,255,255,0.15)'
                    }} />

                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        style={{
                            padding: 14,
                            borderRadius: '50%',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: showSettings ? 'rgba(255,255,255,0.2)' : 'transparent',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Settings size={18} color="white" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MoodLight;
