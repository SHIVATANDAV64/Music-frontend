/**
 * Input Component - Terminal Entry
 * 
 * Philosophy: Data entry console.
 * Monospaced, bottom-heavy, technical focus states.
 */
import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, ...props }, ref) => {
        return (
            <div className="space-y-2 group">
                {label && (
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent-gold)] transition-colors">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <input
                        ref={ref}
                        className={`
                            w-full px-4 py-3 bg-[var(--color-card)] border border-[var(--color-border)]
                            text-[var(--color-text-primary)] font-mono text-sm placeholder:text-[var(--color-text-muted)]
                            focus:outline-none focus:border-[var(--color-accent-gold)] focus:bg-[var(--color-accent-gold)]/5
                            transition-all duration-300
                            ${error ? 'border-red-500/50 bg-red-500/5' : ''}
                            ${className}
                        `}
                        {...props}
                    />

                    {/* Corner Accents (Bottom Right) */}
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-[var(--color-border)] pointer-events-none group-focus-within:border-[var(--color-accent-gold)] transition-colors" />
                </div>

                {error && (
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        <p className="font-mono text-[10px] text-red-500 uppercase tracking-widest">{error}</p>
                    </div>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
