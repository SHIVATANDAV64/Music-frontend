/**
 * Button Component - Tactile Switch
 * 
 * Philosophy: Physical controls. Clicky, responsive, precise.
 * Replaces soft organic buttons with hard technical switches.
 */
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

// Exclude conflicting event handlers between React and Framer Motion
interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'icon' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center font-mono uppercase tracking-wider transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed border relative overflow-hidden group';

        const variants = {
            primary: 'bg-[var(--color-accent-gold)] text-[var(--color-accent-primary)] border-[var(--color-accent-gold)] hover:brightness-110 font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)]',
            secondary: 'bg-[var(--color-card)] text-[var(--color-text-primary)] border-[var(--color-border)] hover:border-[var(--color-text-secondary)] hover:bg-[var(--color-card-hover)] backdrop-blur-sm',
            outline: 'bg-transparent text-[var(--color-accent-gold)] border-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)] hover:text-[var(--color-accent-primary)]',
            ghost: 'bg-transparent text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)]',
            icon: 'bg-transparent text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-accent-gold)] hover:border-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/10 aspect-square rounded-sm',
            danger: 'bg-red-500/10 text-red-500 border-red-500 hover:bg-red-500 hover:text-white'
        };

        const sizes = {
            sm: 'px-4 py-2 text-[10px]',
            md: 'px-6 py-3 text-xs',
            lg: 'px-8 py-4 text-sm',
        };

        const iconSizes = {
            sm: 'p-1.5',
            md: 'p-2.5',
            lg: 'p-3.5',
        };

        const sizeStyles = variant === 'icon' ? iconSizes[size] : sizes[size];

        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`${baseStyles} ${variants[variant]} ${sizeStyles} ${className}`}
                disabled={disabled || isLoading}
                {...props}
            >
                {/* Tech Scanline Effect (Primary only) */}
                {variant === 'primary' && (
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] opacity-0 group-hover:opacity-100 animate-shine pointer-events-none" />
                )}

                {isLoading ? (
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-current animate-ping" />
                        <span>PROCESSING...</span>
                    </div>
                ) : (
                    children
                )}
            </motion.button>
        );
    }
);

Button.displayName = 'Button';
