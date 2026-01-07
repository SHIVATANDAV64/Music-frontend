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
            className="group relative w-10 h-10 flex items-center justify-center border border-[#333] bg-[#0a0a0a] hover:border-[#D4AF37] transition-all duration-300"
        >
            {/* Tech Corners */}
            <span className="absolute top-0 right-0 w-1 h-1 border-t border-r border-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="absolute bottom-0 left-0 w-1 h-1 border-b border-l border-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10 text-[#666] group-hover:text-[#D4AF37] transition-colors">
                {theme === 'dark' ? (
                    <Sun size={16} strokeWidth={1.5} />
                ) : (
                    <Moon size={16} strokeWidth={1.5} />
                )}
            </div>
        </button>
    );
});

export default ThemeToggle;
