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
    /** Get latest data without React state triggers (Zero allocation) */
    getFrequencyData: () => FrequencyData | null;
    isInitialized: boolean;
    /** Raw analyzer node for components that want to poll data manually for better performance */
    analyzer: AnalyserNode | null;
    /** Manually trigger initialization (useful for user interaction requirement) */
    initialize: () => void;
}

const AudioAnalyzerContext = createContext<AudioAnalyzerContextType | undefined>(undefined);

const DEFAULT_FFT_SIZE = 2048;
const SMOOTHING_TIME_CONSTANT = 0.8;

export function AudioAnalyzerProvider({ children }: { children: ReactNode }) {
    const { audio, isPlaying } = usePlayer();

    // Use a Ref for frequencyData to allow components to read it without re-rendering
    // We still keep the state version for components that WANT to react (like smaller UI elements)
    const [frequencyDataState, setFrequencyDataState] = useState<FrequencyData | null>(null);
    const frequencyDataRef = useRef<FrequencyData | null>(null);
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
        const audioElement = audio;
        if (!audioElement) return;

        // If already connected successfully, don't try again
        if (connectionAttemptedRef.current && isInitialized) return;

        if (!audioElement.src) {
            return;
        }

        // CRITICAL CORS SAFETY CHECK:
        // Connecting a MediaElementSource to a cross-origin URL (like Jamendo's CDN) 
        // without proper CORS headers will cause the browser to silence the audio 
        // (outputs zeroes) for security.
        // We MUST skip initialization if the URL is external and not yet proxied.
        // Detect if proxied or internal (anything NOT direct Jamendo)
        const isExternal = audioElement.src.includes('jamendo.com');
        const isAppwrite = audioElement.src.includes('appwrite.io');
        const isBlob = audioElement.src.startsWith('blob:');

        if (isExternal && !isAppwrite && !isBlob) {

            return;
        }

        try {
            // Create audio context if it doesn't exist
            if (!audioContextRef.current) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                audioContextRef.current = new AudioContextClass();
            }
            const audioContext = audioContextRef.current;

            // Create analyzer node if it doesn't exist
            if (!analyzerRef.current) {
                const analyzer = audioContext.createAnalyser();
                analyzer.fftSize = DEFAULT_FFT_SIZE;
                analyzer.smoothingTimeConstant = SMOOTHING_TIME_CONSTANT;
                analyzerRef.current = analyzer;
            }
            const analyzer = analyzerRef.current;

            // Create source from audio element - THIS CAN ONLY BE DONE ONCE
            if (!sourceRef.current) {
                try {
                    const source = audioContext.createMediaElementSource(audioElement);
                    sourceRef.current = source;

                    // Mark element as captured - PlayerContext will use this to know if it needs to reset
                    (audioElement as any)._isCaptured = true;

                    // Connect: source → analyzer → destination (speakers)
                    source.connect(analyzer);
                    analyzer.connect(audioContext.destination);

                } catch (sourceError: any) {
                    if (sourceError.name === 'InvalidStateError') {
                        // Recovery: Audio source already connected.
                    } else {
                        throw sourceError;
                    }
                }
            }

            connectionAttemptedRef.current = true;

            // Initialize data buffers
            const bufferLength = analyzer.frequencyBinCount;
            if (!frequenciesBufferRef.current) frequenciesBufferRef.current = new Uint8Array(bufferLength);
            if (!waveformBufferRef.current) waveformBufferRef.current = new Uint8Array(bufferLength);

            setIsInitialized(true);


        } catch (error) {
            console.error('[AudioAnalyzerContext] Failed to initialize:', error);
            connectionAttemptedRef.current = false;
        }
    };

    // Try to initialize when audio element becomes available and has a source
    useEffect(() => {
        const audioElement = audio;
        if (!audioElement) return;

        // Reset connection flag if the audio element instance changed
        if ((audioElement as any)._lastInstance !== audioElement) {
            sourceRef.current = null; // Recreate source node for the new element
            connectionAttemptedRef.current = false;
            (audioElement as any)._lastInstance = audioElement;
            setIsInitialized(false);
        }

        if (!connectionAttemptedRef.current && audioElement.src) {
            // Small delay to ensure audio element is fully ready
            const timeoutId = setTimeout(initialize, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [audio, audio.src]);

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

        // Create a persistent wrapper object to avoid per-frame object allocation
        const snapshot: FrequencyData = {
            frequencies: frequenciesBufferRef.current!,
            waveform: waveformBufferRef.current!,
            bassEnergy: 0,
            midEnergy: 0,
            trebleEnergy: 0,
            volume: 0,
        };

        const analyze = () => {
            const analyzer = analyzerRef.current;
            const frequencies = frequenciesBufferRef.current;
            const waveform = waveformBufferRef.current;

            if (!analyzer || !frequencies || !waveform) {
                animationFrameRef.current = requestAnimationFrame(analyze);
                return;
            }

            // 1. In-place buffer update (Zero allocation)
            analyzer.getByteFrequencyData(frequencies as unknown as Uint8Array<ArrayBuffer>);
            analyzer.getByteTimeDomainData(waveform as unknown as Uint8Array<ArrayBuffer>);

            // 2. Efficient Energy Calculation
            const bassEnd = 12; // ~250Hz
            const midEnd = 186; // ~4000Hz
            let bassSum = 0, midSum = 0, trebleSum = 0, volumeSum = 0;

            for (let i = 0; i < frequencies.length; i++) {
                const value = frequencies[i] / 255;
                volumeSum += value;
                if (i < bassEnd) bassSum += value;
                else if (i < midEnd) midSum += value;
                else trebleSum += value;
            }

            const sensitivity = 1.2;
            snapshot.bassEnergy = Math.min(1, (bassSum / (bassEnd || 1)) * sensitivity);
            snapshot.midEnergy = Math.min(1, (midSum / ((midEnd - bassEnd) || 1)) * sensitivity);
            snapshot.trebleEnergy = Math.min(1, (trebleSum / ((frequencies.length - midEnd) || 1)) * sensitivity);
            snapshot.volume = Math.min(1, (volumeSum / (frequencies.length || 1)) * sensitivity);

            // 3. Update Ref (Synchronous, zero-latency, zero-allocation)
            frequencyDataRef.current = snapshot;

            // 4. Throttled State Update (Reactive UI)
            // We only allocate when we actually want to trigger a React render
            if (frameCountRef.current % 4 === 0) {
                setFrequencyDataState({
                    ...snapshot,
                    frequencies: new Uint8Array(frequencies), // Immutable snapshot for React
                    waveform: new Uint8Array(waveform),
                });
            }
            frameCountRef.current++;

            animationFrameRef.current = requestAnimationFrame(analyze);
        };

        const frameCountRef = { current: 0 };
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
        <AudioAnalyzerContext.Provider value={{
            frequencyData: frequencyDataState,
            getFrequencyData: () => frequencyDataRef.current,
            analyzer: analyzerRef.current,
            isInitialized,
            initialize
        }}>
            {children}
        </AudioAnalyzerContext.Provider>
    );
}

/**
 * Hook to access shared audio frequency data (Reactive version)
 * Causes re-renders at ~15fps. Good for small bars, basic UI.
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
