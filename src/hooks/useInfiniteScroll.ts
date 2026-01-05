/**
 * useInfiniteScroll Hook
 * Intersection Observer based infinite scroll with debouncing
 */
import { useEffect, useRef, useState, useCallback } from 'react';

interface UseInfiniteScrollOptions {
    /** Threshold for triggering load (0-1) */
    threshold?: number;
    /** Root margin for early triggering */
    rootMargin?: string;
    /** Debounce delay in ms */
    debounceMs?: number;
}

interface UseInfiniteScrollReturn {
    /** Ref to attach to sentinel element */
    sentinelRef: React.RefObject<HTMLDivElement | null>;
    /** Whether currently loading more */
    isLoadingMore: boolean;
    /** Set loading state */
    setIsLoadingMore: (loading: boolean) => void;
    /** Reset scroll state */
    reset: () => void;
}

export function useInfiniteScroll(
    onLoadMore: () => Promise<void>,
    hasMore: boolean,
    options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn {
    const { threshold = 0.1, rootMargin = '100px', debounceMs = 300 } = options;

    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const debounceTimeoutRef = useRef<number | null>(null);

    const handleIntersection = useCallback(
        async (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries;

            if (entry.isIntersecting && hasMore && !isLoadingMore) {
                // Clear any pending debounce
                if (debounceTimeoutRef.current) {
                    clearTimeout(debounceTimeoutRef.current);
                }

                // Debounce the load
                debounceTimeoutRef.current = setTimeout(async () => {
                    setIsLoadingMore(true);
                    try {
                        await onLoadMore();
                    } catch (error) {
                        console.error('Failed to load more:', error);
                    } finally {
                        setIsLoadingMore(false);
                    }
                }, debounceMs);
            }
        },
        [onLoadMore, hasMore, isLoadingMore, debounceMs]
    );

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(handleIntersection, {
            threshold,
            rootMargin,
        });

        observer.observe(sentinel);

        return () => {
            observer.disconnect();
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [handleIntersection, threshold, rootMargin]);

    const reset = useCallback(() => {
        setIsLoadingMore(false);
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
    }, []);

    return {
        sentinelRef,
        isLoadingMore,
        setIsLoadingMore,
        reset,
    };
}
