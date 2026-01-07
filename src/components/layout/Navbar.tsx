/**
 * Navbar - Observation Deck
 * 
 * Philosophy: Top-level controls for the audio system.
 * Minimalist, always accessible, floating above the chaos.
 */
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, ChevronDown, Command, Menu } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function handleLogout() {
        await logout();
        navigate('/login');
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    }

    return (
        <header
            className="fixed top-0 right-0 left-0 md:left-[var(--sidebar-width,280px)] h-16 md:h-20 flex items-center justify-between px-4 md:px-8 transition-all duration-300 z-40 bg-[var(--color-void)]/80 backdrop-blur-md border-b border-[var(--color-border)]"
        >
            {/* Mobile Menu Toggle */}
            <button
                onClick={onMenuClick}
                className="md:hidden p-2 -ml-2 text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors"
            >
                <Menu size={24} strokeWidth={1.5} />
            </button>

            {/* Search Module - Technical Input */}
            <form onSubmit={handleSearch} className="relative w-full max-w-lg hidden md:block group ml-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-gold)] transition-colors" size={16} />
                <input
                    type="text"
                    placeholder="Search database..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] font-mono text-sm focus:outline-none focus:border-[var(--color-accent-gold)] focus:bg-[var(--color-card-hover)] transition-all duration-300"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                    <Command size={12} className="text-[var(--color-text-muted)]" />
                    <span className="font-mono text-[10px] text-[var(--color-text-muted)]">K</span>
                </div>
            </form>

            {/* User Control Module */}
            <div className="flex items-center gap-6">
                {isAuthenticated ? (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className={`
                                flex items-center gap-3 pl-1 pr-4 py-1 border transition-all duration-300
                                ${showDropdown ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/10' : 'border-transparent hover:border-[var(--color-border)]'}
                            `}
                        >
                            <div className="w-8 h-8 flex items-center justify-center bg-[var(--color-card)] border border-[var(--color-border)]">
                                {user?.avatar_url ? (
                                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" />
                                ) : (
                                    <User size={14} className="text-[var(--color-text-muted)]" />
                                )}
                            </div>
                            <div className="hidden sm:flex flex-col items-start">
                                <span className="font-mono text-[10px] text-[var(--color-accent-gold)] uppercase tracking-wider leading-none mb-1">Operator</span>
                                <span className="font-display text-sm text-[var(--color-text-primary)] leading-none">{user?.username}</span>
                            </div>
                            <ChevronDown size={12} className={`text-[var(--color-text-muted)] transition-transform duration-300 ${showDropdown ? 'rotate-180 text-[var(--color-accent-gold)]' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 top-full mt-2 w-56 bg-[var(--color-card)] border border-[var(--color-border)] shadow-2xl z-50"
                                >
                                    {/* Dropdown Header */}
                                    <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-card)]">
                                        <p className="font-mono text-[9px] text-[var(--color-text-muted)] uppercase tracking-widest mb-1">Signed in as</p>
                                        <p className="font-display text-sm text-[var(--color-text-primary)] truncate">{user?.email}</p>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="p-1">
                                        <Link
                                            to="/profile"
                                            className="flex items-center gap-3 px-4 py-3 text-sm font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card-hover)] transition-colors group"
                                            onClick={() => setShowDropdown(false)}
                                        >
                                            <User size={14} className="group-hover:text-[var(--color-accent-gold)] transition-colors" />
                                            PROFILE_DATA
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-mono text-[var(--color-text-muted)] hover:text-red-400 hover:bg-[var(--color-card-hover)] transition-colors group text-left"
                                        >
                                            <LogOut size={14} className="group-hover:text-red-500 transition-colors" />
                                            TERMINATE_SESSION
                                        </button>
                                    </div>

                                    {/* Dropdown Footer - Decorative */}
                                    <div className="h-1 w-full bg-[var(--color-accent-gold)]/20 flex">
                                        <div className="w-1/3 h-full bg-[var(--color-accent-gold)]" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <Link to="/login">
                            <span className="font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors uppercase tracking-wider">Log in</span>
                        </Link>
                        <Link to="/register">
                            <Button variant="outline" className="border-[var(--color-accent-gold)] text-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)] hover:text-black">
                                INITIALIZE
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
}
