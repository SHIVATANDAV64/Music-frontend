import { motion } from 'framer-motion';

interface SkeletonProps {
    className?: string;
}

/**
 * SkeletonPulse - Base shimmer animation
 * Adjusted to be a sharp, technical scan rather than organic pulse
 */
export function SkeletonPulse({ className = '' }: SkeletonProps) {
    return (
        <div className={`relative overflow-hidden bg-[#111] border border-[#222] ${className}`}>
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#222] to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
        </div>
    );
}

/**
 * SkeletonCard - Card loading state for music/podcast items
 */
export function SkeletonCard({ className = '' }: SkeletonProps) {
    return (
        <div className={`p-0 bg-transparent ${className}`}>
            <SkeletonPulse className="aspect-square mb-4 border border-[#222]" />
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
        <div className={`flex items-center gap-4 p-4 border-b border-[#222] ${className}`}>
            <SkeletonPulse className="w-10 h-10 flex-shrink-0" />
            <div className="flex-1">
                <SkeletonPulse className="h-4 w-1/2 mb-2" />
                <SkeletonPulse className="h-3 w-1/3" />
            </div>
            <SkeletonPulse className="w-16 h-4" />
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

    // Note: Kept rounded-full for avatar skeleton to match actual avatar shape, 
    // but logic could be changed to square if we move to square avatars completely.
    // For now, avatars are circular in many places.
    return <SkeletonPulse className={`${sizeClasses[size]} rounded-full border border-[#222]`} />;
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
