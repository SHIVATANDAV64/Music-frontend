/**
 * Input Component
 * Styled form input with glass effect
 */
import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, ...props }, ref) => {
        return (
            <div className="space-y-1.5">
                {label && (
                    <label className="block text-sm font-medium text-text-secondary">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`
            w-full px-4 py-3 rounded-lg
            glass text-text-primary placeholder:text-text-secondary/50
            focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
            transition-all duration-200
            ${error ? 'ring-2 ring-error/50' : ''}
            ${className}
          `}
                    {...props}
                />
                {error && (
                    <p className="text-sm text-error">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
