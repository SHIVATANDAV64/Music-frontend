import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Activity } from 'lucide-react';
import { MiniAttractor } from './MiniAttractor';
import { useAuth } from '../../context/AuthContext';

export const PillNav = () => {
    const { isAuthenticated } = useAuth();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-0' : 'py-4'}`}>
            <nav
                className={`
                    mx-auto max-w-[1400px] flex items-center justify-between px-6 py-4
                    transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]
                    ${scrolled
                        ? 'bg-[var(--color-void)]/90 backdrop-blur-md border-b border-[var(--color-border)]'
                        : 'bg-transparent border-b border-transparent'}
                `}
            >
                {/* Logo Area */}
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="relative w-8 h-8 flex items-center justify-center border border-[var(--color-border)] group-hover:border-[var(--color-accent-gold)] transition-colors">
                            <Terminal size={14} className="text-[var(--color-accent-gold)]" />
                            {/* Tech corners */}
                            <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-[var(--color-accent-gold)]" />
                            <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-[var(--color-accent-gold)]" />
                        </div>
                        <span className="font-display font-medium text-lg tracking-wider text-[var(--color-text-primary)]">
                            AUDIO<span className="text-[var(--color-accent-gold)]">_OS</span>
                        </span>
                    </Link>
                </div>

                {/* Center Links - Technical Indicators */}
                <div className="hidden md:flex items-center gap-12 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                    {['SYSTEM', 'MODULES', 'VISUALS'].map((item) => (
                        <a key={item} href="#" className="hover:text-[var(--color-text-primary)] transition-colors relative group flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-[var(--color-accent-gold)] opacity-0 group-hover:opacity-100 transition-opacity" />
                            {item}
                        </a>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-6">
                    {!isAuthenticated && (
                        <Link
                            to="/login"
                            className="relative flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors border border-[var(--color-border)] hover:border-[var(--color-accent-gold)]/50 px-4 py-2 overflow-hidden group"
                        >
                            <MiniAttractor />
                            <Activity size={12} className="relative z-10" />
                            <span className="relative z-10">Terminal_Login</span>
                        </Link>
                    )}
                </div>
            </nav>
        </div>
    );
};
