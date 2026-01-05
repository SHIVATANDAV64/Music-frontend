/**
 * AudioAnalyzerContext
 * 
 * CRITICAL: A MediaElementSourceNode can only be created ONCE per audio element.
 * This context creates the audio analysis chain once and shares the data with all
 * visualizer components, preventing the "HTMLMediaElement already connected" error.
 * 
 * Philosophy: Sound creates geometry. We analyze once, visualize everywhere.
 */

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePlayer } from './PlayerContext';

export interface FrequencyData {
    /** Raw frequency data (0-255 for each frequency bin) */
    frequencies: Uint8Array;
    /** Time domain data for waveform visualization */
    waveform: Uint8Array;
    /** Normalized bass energy (0-1) */
    bassEnergy: number;
    /** Normalized mid energy (0-1) */
    midEnergy: number;
    /** Normalized treble energy (0-1) */
    trebleEnergy: number;
    /** Overall volume level (0-1) */
    volume: number;
}

interface AudioAnalyzerContextType {
    frequencyData: FrequencyData | null;
    isInitialized: boolean;
    /** Manually trigger initialization (useful for user interaction requirement) */
    initialize: () => void;
}

const AudioAnalyzerContext = createContext<AudioAnalyzerContextType | undefined>(undefined);

const DEFAULT_FFT_SIZE = 2048;
const SMOOTHING_TIME_CONSTANT = 0.8;

export function AudioAnalyzerProvider({ children }: { children: ReactNode }) {
    const { audioRef, isPlaying } = usePlayer();

    const [frequencyData, setFrequencyData] = useState<FrequencyData | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Singleton refs - only one AudioContext per app
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const frequenciesBufferRef = useRef<Uint8Array | null>(null);
    const waveformBufferRef = useRef<Uint8Array | null>(null);

    // Flag to track if we've attempted connection
    const connectionAttemptedRef = useRef(false);

    const initialize = () => {
        const audioElement = audioRef.current;
        if (!audioElement || connectionAttemptedRef.current) return;

        // Check if audio element has a valid source
        if (!audioElement.src) {
            console.warn('[AudioAnalyzerContext] Audio element has no source yet');
            return;
        }

        // CRITICAL CORS SAFETY CHECK:
        // Connecting a MediaElementSource to a cross-origin URL (like Jamendo's CDN) 
        // without proper CORS headers will cause the browser to silence the audio 
        // (outputs zeroes) for security.
        // We MUST skip initialization if the URL is external and not yet proxied.
        const isProxied = audioElement.src.startsWith('blob:');
        const isExternal = audioElement.src.includes('jamendo.com');

        if (isExternal && !isProxied) {
            console.log('[AudioAnalyzerContext] Skipping initialization for cross-origin URL to prevent silence. Waiting for proxy...');
            return;
        }

        try {
            // Create audio context (Safari needs webkitAudioContext)
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContextClass();
            audioContextRef.current = audioContext;

            // Create analyzer node
            const analyzer = audioContext.createAnalyser();
            analyzer.fftSize = DEFAULT_FFT_SIZE;
            analyzer.smoothingTimeConstant = SMOOTHING_TIME_CONSTANT;
            analyzerRef.current = analyzer;

            // Create source from audio element - THIS CAN ONLY BE DONE ONCE
            // If we do this on a Jamendo URL, it will be silenced. 
            // By waiting for the blob: URL, we ensure it's safe.
            const source = audioContext.createMediaElementSource(audioElement);
            sourceRef.current = source;
            connectionAttemptedRef.current = true;

            // Connect: source → analyzer → destination (speakers)
            source.connect(analyzer);
            analyzer.connect(audioContext.destination);

            // Initialize data buffers
            const bufferLength = analyzer.frequencyBinCount;
            frequenciesBufferRef.current = new Uint8Array(bufferLength);
            waveformBufferRef.current = new Uint8Array(bufferLength);

            setIsInitialized(true);

            console.log('[AudioAnalyzerContext] Initialized successfully with safe source', {
                fftSize: analyzer.fftSize,
                src: audioElement.src.substring(0, 30) + '...',
            });
        } catch (error) {
            console.error('[AudioAnalyzerContext] Failed to initialize:', error);
            // Don't set connectionAttemptedRef to true on error, so we can retry
            connectionAttemptedRef.current = false;
        }
    };

    // Try to initialize when audio element becomes available and has a source
    useEffect(() => {
        const audioElement = audioRef.current;
        if (audioElement && !connectionAttemptedRef.current && audioElement.src) {
            // Small delay to ensure audio element is fully ready
            const timeoutId = setTimeout(() => {
                initialize();
            }, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [audioRef.current?.src]);

    // Resume audio context on user interaction (required by browsers)
    useEffect(() => {
        const audioContext = audioContextRef.current;
        if (audioContext && audioContext.state === 'suspended' && isPlaying) {
            audioContext.resume();
        }
    }, [isPlaying]);

    // Analyze audio on every animation frame when playing
    useEffect(() => {
        if (!isInitialized) return;

        const analyze = () => {
            const analyzer = analyzerRef.current;
            const frequencies = frequenciesBufferRef.current;
            const waveform = waveformBufferRef.current;

            if (!analyzer || !frequencies || !waveform) {
                animationFrameRef.current = requestAnimationFrame(analyze);
                return;
            }

            // Get frequency data (type assertion needed for strict TypeScript)
            analyzer.getByteFrequencyData(frequencies as unknown as Uint8Array<ArrayBuffer>);
            analyzer.getByteTimeDomainData(waveform as unknown as Uint8Array<ArrayBuffer>);

            // Calculate energy in different frequency ranges with more precision
            // Standard audio bands:
            // Bass: 20Hz - 250Hz
            // Mids: 250Hz - 4000Hz
            // Treble: 4000Hz+
            // Each bin is approx 21.5Hz with FFT 2048
            const bassEnd = 12; // ~250Hz
            const midEnd = 186; // ~4000Hz

            let bassSum = 0, midSum = 0, trebleSum = 0, volumeSum = 0;

            for (let i = 0; i < frequencies.length; i++) {
                const value = frequencies[i] / 255;
                volumeSum += value;

                if (i < bassEnd) {
                    bassSum += value;
                } else if (i < midEnd) {
                    midSum += value;
                } else {
                    trebleSum += value;
                }
            }

            // Apply a slight boost to responsiveness
            const sensitivity = 1.2;

            setFrequencyData({
                frequencies: frequencies.slice(),
                waveform: waveform.slice(),
                bassEnergy: Math.min(1, (bassSum / (bassEnd || 1)) * sensitivity),
                midEnergy: Math.min(1, (midSum / ((midEnd - bassEnd) || 1)) * sensitivity),
                trebleEnergy: Math.min(1, (trebleSum / ((frequencies.length - midEnd) || 1)) * sensitivity),
                volume: Math.min(1, (volumeSum / (frequencies.length || 1)) * sensitivity),
            });

            animationFrameRef.current = requestAnimationFrame(analyze);
        };

        analyze();

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isInitialized]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            // Note: Don't close AudioContext here as it can't be reopened
            // and the source node is tied to the audio element
        };
    }, []);

    return (
        <AudioAnalyzerContext.Provider value={{ frequencyData, isInitialized, initialize }}>
            {children}
        </AudioAnalyzerContext.Provider>
    );
}

/**
 * Hook to access shared audio frequency data
 * 
 * Use this instead of useAudioAnalyzer to avoid duplicate MediaElementSource creation
 */
export function useAudioFrequency(): FrequencyData | null {
    const context = useContext(AudioAnalyzerContext);
    if (context === undefined) {
        throw new Error('useAudioFrequency must be used within an AudioAnalyzerProvider');
    }
    return context.frequencyData;
}

/**
 * Hook to access the full AudioAnalyzer context
 */
export function useAudioAnalyzerContext(): AudioAnalyzerContextType {
    const context = useContext(AudioAnalyzerContext);
    if (context === undefined) {
        throw new Error('useAudioAnalyzerContext must be used within an AudioAnalyzerProvider');
    }
    return context;
}
