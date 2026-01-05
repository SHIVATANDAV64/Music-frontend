/**
 * Skeleton Components
 * Unified loading state components following Luxury design system
 * 
 * Philosophy: Loading states should feel elegant, not frustrating
 * Uses subtle shimmer animation with gold accent
 */
import { motion } from 'framer-motion';

interface SkeletonProps {
    className?: string;
}

/**
 * SkeletonPulse - Base shimmer animation
 */
export function SkeletonPulse({ className = '' }: SkeletonProps) {
    return (
        <motion.div
            className={`bg-[#1a1a1a] rounded ${className}`}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
    );
}

/**
 * SkeletonCard - Card loading state for music/podcast items
 */
export function SkeletonCard({ className = '' }: SkeletonProps) {
    return (
        <div className={`p-5 rounded-2xl bg-[#111111] ${className}`}>
            <SkeletonPulse className="aspect-square rounded-xl mb-4" />
            <SkeletonPulse className="h-4 w-3/4 mb-2" />
            <SkeletonPulse className="h-3 w-1/2" />
        </div>
    );
}

/**
 * SkeletonRow - Row loading state for list items
 */
export function SkeletonRow({ className = '' }: SkeletonProps) {
    return (
        <div className={`flex items-center gap-4 p-4 rounded-xl bg-[#111111] ${className}`}>
            <SkeletonPulse className="w-12 h-12 rounded-lg flex-shrink-0" />
            <div className="flex-1">
                <SkeletonPulse className="h-4 w-1/2 mb-2" />
                <SkeletonPulse className="h-3 w-1/3" />
            </div>
            <SkeletonPulse className="w-16 h-8 rounded-full" />
        </div>
    );
}

/**
 * SkeletonText - Text line loading state
 */
export function SkeletonText({ className = '' }: SkeletonProps) {
    return <SkeletonPulse className={`h-4 ${className}`} />;
}

/**
 * SkeletonAvatar - Profile/avatar loading state
 */
export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
    };

    return <SkeletonPulse className={`${sizeClasses[size]} rounded-full`} />;
}

/**
 * SkeletonGrid - Grid of skeleton cards
 */
export function SkeletonGrid({ count = 8, className = '' }: { count?: number; className?: string }) {
    return (
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}
