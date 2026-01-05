/**
 * Dominant Color Extraction Utility
 * Extracts the dominant color from an image for dynamic backgrounds.
 * Based on soulmate-mono's FullscreenPlayer implementation.
 */

interface ColorResult {
    rgba: string;
    rgb: { r: number; g: number; b: number };
}

/**
 * Extract dominant color from an image URL
 * @param imageUrl - URL of the image to analyze
 * @param opacity - Opacity for the rgba result (default 0.3)
 * @returns Promise with rgba string and rgb values
 */
export async function extractDominantColor(
    imageUrl: string,
    opacity: number = 0.3
): Promise<ColorResult> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    resolve(getDefaultColor(opacity));
                    return;
                }

                // Sample at low resolution for performance
                canvas.width = 50;
                canvas.height = 50;
                ctx.drawImage(img, 0, 0, 50, 50);

                const imageData = ctx.getImageData(0, 0, 50, 50).data;
                let r = 0, g = 0, b = 0, count = 0;

                // Analyze pixels, skipping very dark and very light ones
                for (let i = 0; i < imageData.length; i += 4) {
                    const pixelR = imageData[i];
                    const pixelG = imageData[i + 1];
                    const pixelB = imageData[i + 2];

                    const brightness = (pixelR + pixelG + pixelB) / 3;

                    // Skip very dark (<30) and very light (>220) pixels
                    if (brightness > 30 && brightness < 220) {
                        r += pixelR;
                        g += pixelG;
                        b += pixelB;
                        count++;
                    }
                }

                if (count > 0) {
                    r = Math.floor(r / count);
                    g = Math.floor(g / count);
                    b = Math.floor(b / count);

                    resolve({
                        rgba: `rgba(${r}, ${g}, ${b}, ${opacity})`,
                        rgb: { r, g, b }
                    });
                } else {
                    resolve(getDefaultColor(opacity));
                }
            } catch (error) {
                console.error('Color extraction failed:', error);
                resolve(getDefaultColor(opacity));
            }
        };

        img.onerror = () => {
            console.warn('Failed to load image for color extraction');
            resolve(getDefaultColor(opacity));
        };

        img.src = imageUrl;
    });
}

/**
 * Get default fallback color (forest-at-dusk gold)
 */
function getDefaultColor(opacity: number): ColorResult {
    return {
        rgba: `rgba(201, 169, 98, ${opacity})`,
        rgb: { r: 201, g: 169, b: 98 }
    };
}

/**
 * Generate a gradient string from extracted color
 */
export function createGradientFromColor(color: ColorResult): string {
    return `linear-gradient(180deg, ${color.rgba} 0%, rgba(10, 10, 10, 1) 100%)`;
}

/**
 * Hook to extract and cache dominant color from current track
 */
import { useState, useEffect } from 'react';

export function useDominantColor(imageUrl: string | undefined) {
    const [color, setColor] = useState<ColorResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!imageUrl) {
            setColor(null);
            return;
        }

        setIsLoading(true);
        extractDominantColor(imageUrl)
            .then(setColor)
            .finally(() => setIsLoading(false));
    }, [imageUrl]);

    return { color, isLoading };
}
