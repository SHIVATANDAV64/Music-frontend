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
            className="fixed top-0 right-0 h-16 glass-dark z-30 flex items-center justify-between px-6"
            style={{ left: 'var(--sidebar-width)' }}
        >
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                    type="text"
                    placeholder="Search tracks, podcasts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white/5 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all duration-200"
                />
            </form>

            {/* User Menu */}
            <div className="flex items-center gap-4">
                {isAuthenticated ? (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-2 px-3 py-2 rounded-full glass hover:bg-white/10 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                                {user?.avatar_url ? (
                                    <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User size={18} className="text-accent" />
                                )}
                            </div>
                            <span className="text-sm font-medium">{user?.username}</span>
                            <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
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
