/**
 * Navbar Component
 * Top navigation bar with search and user menu
 */
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
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
            className="fixed top-0 right-0 h-16 glass-dark z-30 flex items-center justify-between px-6 transition-all duration-300"
            style={{ left: 'var(--sidebar-width, 280px)' }}
        >
            {/* Search Bar - improved visibility */}
            <form onSubmit={handleSearch} className="relative w-full max-w-md hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input
                    type="text"
                    placeholder="Search tracks, podcasts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 rounded-full bg-white/15 text-white placeholder:text-white/40 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/60 focus:bg-white/20 transition-all duration-300"
                />
            </form>

            {/* User Menu */}
            <div className="flex items-center gap-4">
                {isAuthenticated ? (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 active:scale-95"
                        >
                            <div className="w-8 h-8 rounded-full bg-[var(--gold)]/20 flex items-center justify-center border border-[var(--gold)]/30">
                                {user?.avatar_url ? (
                                    <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User size={18} className="text-[var(--gold)]" />
                                )}
                            </div>
                            <span className="text-sm font-semibold text-white/90 hidden sm:inline-block">{user?.username}</span>
                            <ChevronDown size={14} className={`text-white/50 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute right-0 top-full mt-2 w-48 glass rounded-lg overflow-hidden shadow-xl"
                                >
                                    <Link
                                        to="/profile"
                                        className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-white/5 transition-colors"
                                        onClick={() => setShowDropdown(false)}
                                    >
                                        <User size={16} />
                                        Profile
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-error hover:bg-white/5 transition-colors"
                                    >
                                        <LogOut size={16} />
                                        Logout
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <Link to="/login">
                            <Button variant="ghost">Log in</Button>
                        </Link>
                        <Link to="/register">
                            <Button variant="primary">Sign up</Button>
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
}
