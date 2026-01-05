/**
 * Button Component
 * Premium styled button with variants and glow effect
 */
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

// Exclude conflicting event handlers between React and Framer Motion
interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed';

        const variants = {
            primary: 'bg-accent text-white hover:bg-accent/90 glow-button',
            secondary: 'glass text-text-primary hover:bg-white/10',
            ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5',
            icon: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-full',
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2 text-base',
            lg: 'px-6 py-3 text-lg',
        };

        const iconSizes = {
            sm: 'p-1.5',
            md: 'p-2',
            lg: 'p-3',
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
                {isLoading ? (
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                ) : null}
                {children}
            </motion.button>
        );
    }
);

Button.displayName = 'Button';
