/**
 * useAudioAnalyzer Hook
 * 
 * Philosophy: Sound creates geometry. This hook extracts the actual frequencies
 * from playing audio to drive organic, physics-based visualizations.
 * 
 * Based on Web Audio API - gets REAL frequency data, not fake random values.
 */

import { useEffect, useRef, useState } from 'react';

export interface FrequencyData {
    /** Raw frequency data (0-255 for each frequency bin) */
    frequencies: Uint8Array;
    /** Time domain data for waveform visualization */
    waveform: Uint8Array;
    /** Detected beats per minute (null if not yet detected) */
    bpm: number | null;
    /** Normalized bass energy (0-1) */
    bassEnergy: number;
    /** Normalized mid energy (0-1) */
    midEnergy: number;
    /** Normalized treble energy (0-1) */
    trebleEnergy: number;
    /** Overall volume level (0-1) */
    volume: number;
}

interface UseAudioAnalyzerOptions {
    /** FFT size for frequency analysis (larger = more detail, more CPU) */
    fftSize?: 256 | 512 | 1024 | 2048 | 4096 | 8192;
    /** Smoothing time constant (0-1, higher = smoother but less responsive) */
    smoothingTimeConstant?: number;
    /** Enable BPM detection (more CPU intensive) */
    enableBpmDetection?: boolean;
}

const DEFAULT_OPTIONS: Required<UseAudioAnalyzerOptions> = {
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    enableBpmDetection: false,
};

/**
 * Hook to analyze audio in real-time using Web Audio API
 * 
 * @param audioElement - The HTML audio element to analyze
 * @param options - Configuration for the analyzer
 * @returns Real-time frequency and waveform data
 * 
 * @example
 * const { frequencies, bassEnergy, midEnergy, trebleEnergy } = useAudioAnalyzer(audioRef.current);
 * // Use bassEnergy to drive particle movement in visualizer
 */
export function useAudioAnalyzer(
    audioElement: HTMLAudioElement | null,
    options: UseAudioAnalyzerOptions = {}
): FrequencyData | null {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    const [frequencyData, setFrequencyData] = useState<FrequencyData | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Buffers for frequency and waveform data
    const frequenciesRef = useRef<Uint8Array | null>(null);
    const waveformRef = useRef<Uint8Array | null>(null);

    useEffect(() => {
        if (!audioElement) return;

        // Initialize Web Audio API
        const initializeAudioContext = () => {
            try {
                // Create audio context (Safari needs webkitAudioContext)
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                const audioContext = new AudioContextClass();
                audioContextRef.current = audioContext;

                // Create analyzer node
                const analyzer = audioContext.createAnalyser();
                analyzer.fftSize = opts.fftSize;
                analyzer.smoothingTimeConstant = opts.smoothingTimeConstant;
                analyzerRef.current = analyzer;

                // Create source from audio element (only once)
                if (!sourceRef.current) {
                    const source = audioContext.createMediaElementSource(audioElement);
                    sourceRef.current = source;

                    // Connect: source → analyzer → destination (speakers)
                    source.connect(analyzer);
                    analyzer.connect(audioContext.destination);
                }

                // Initialize data buffers
                const bufferLength = analyzer.frequencyBinCount;
                frequenciesRef.current = new Uint8Array(bufferLength);
                waveformRef.current = new Uint8Array(bufferLength);

                console.log('[AudioAnalyzer] Initialized', {
                    fftSize: analyzer.fftSize,
                    bufferLength,
                    sampleRate: audioContext.sampleRate,
                });
            } catch (error) {
                console.error('[AudioAnalyzer] Failed to initialize:', error);
            }
        };

        initializeAudioContext();

        // Analyze audio on every animation frame
        const analyze = () => {
            const analyzer = analyzerRef.current;
            const frequencies = frequenciesRef.current;
            const waveform = waveformRef.current;

            if (!analyzer || !frequencies || !waveform) {
                animationFrameRef.current = requestAnimationFrame(analyze);
                return;
            }

            // Get frequency data (0-255 for each frequency bin)
            analyzer.getByteFrequencyData(frequencies as any);

            // Get waveform data (time domain)
            analyzer.getByteTimeDomainData(waveform as any);

            // Calculate energy in different frequency ranges
            // Bass: 20-250 Hz (indices 0-10 approximately)
            // Mid: 250-2000 Hz (indices 10-80 approximately)
            // Treble: 2000-20000 Hz (indices 80+ approximately)
            const bassEnd = Math.floor(frequencies.length * 0.1);
            const midEnd = Math.floor(frequencies.length * 0.4);

            let bassSum = 0;
            let midSum = 0;
            let trebleSum = 0;
            let volumeSum = 0;

            for (let i = 0; i < frequencies.length; i++) {
                const value = frequencies[i] / 255; // Normalize to 0-1
                volumeSum += value;

                if (i < bassEnd) {
                    bassSum += value;
                } else if (i < midEnd) {
                    midSum += value;
                } else {
                    trebleSum += value;
                }
            }

            const bassEnergy = bassSum / bassEnd;
            const midEnergy = midSum / (midEnd - bassEnd);
            const trebleEnergy = trebleSum / (frequencies.length - midEnd);
            const volume = volumeSum / frequencies.length;

            // Update state with new analysis data
            setFrequencyData({
                frequencies: new Uint8Array(frequencies.slice()), // Clone to prevent mutation
                waveform: new Uint8Array(waveform.slice()),
                bpm: null, // TODO: Implement BPM detection in future
                bassEnergy,
                midEnergy,
                trebleEnergy,
                volume,
            });

            animationFrameRef.current = requestAnimationFrame(analyze);
        };

        // Start analysis loop
        analyze();

        // Cleanup
        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            // Don't disconnect source - it can only be created once per element
            // Audio context will be cleaned up when component unmounts completely
        };
    }, [audioElement, opts.fftSize, opts.smoothingTimeConstant]);

    // Cleanup audio context on unmount
    useEffect(() => {
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    return frequencyData;
}
