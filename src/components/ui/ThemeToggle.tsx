/**
 * Theme Toggle Component
 * Simple button to switch between dark and light modes.
 */

import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = memo(function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="theme-toggle"
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '1px solid var(--gold-muted)',
                background: 'transparent',
                color: 'var(--gold)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
            }}
        >
            {theme === 'dark' ? (
                <Sun size={18} strokeWidth={1.5} />
            ) : (
                <Moon size={18} strokeWidth={1.5} />
            )}
        </button>
    );
});

export default ThemeToggle;
