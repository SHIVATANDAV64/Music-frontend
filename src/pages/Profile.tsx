/**
 * Profile Page - The Listener's Identity
 * 
 * Philosophy: Each listener is unique, with their own journey through sound.
 * Display their story with warmth and personality.
 */
import { Music, Heart, Clock, ListMusic, Settings, LogOut } from 'lucide-react';
import { AmbientGlow } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';

export function Profile() {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, isLoading, navigate]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#c9a962] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    const menuItems = [
        { icon: Heart, label: 'Favorites', href: '/favorites', description: 'Sounds that moved you' },
        { icon: ListMusic, label: 'Playlists', href: '/playlists', description: 'Your curated collections' },
        { icon: Clock, label: 'Listening History', href: '/history', description: 'Your journey through sound' },
        { icon: Settings, label: 'Settings', href: '/settings', description: 'Preferences and account' },
    ];

    return (
        <div className="min-h-screen relative">
            <AmbientGlow isActive={true} intensity={0.15} />

            <div className="max-w-4xl mx-auto px-8 py-16">
                {/* Profile Header */}
                <div className="flex items-center gap-8 mb-16">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#c9a962] to-[#8b6914] flex items-center justify-center shadow-lg">
                        <span className="text-5xl font-serif text-[#0a0a0a]">
                            {user.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div>
                        <p className="text-[#4a5e4a] text-xs uppercase tracking-widest mb-2">
                            Welcome back
                        </p>
                        <h1 className="text-4xl md:text-5xl font-serif text-[#fafaf5] mb-2">
                            {user.username}
                        </h1>
                        {user.is_admin && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#c9a962]/20 text-[#c9a962] text-xs uppercase tracking-wider">
                                <Music size={12} /> Admin
                            </span>
                        )}
                    </div>
                </div>

                {/* Menu Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                    {menuItems.map((item) => (
                        <Link
                            key={item.label}
                            to={item.href}
                            className="p-6 rounded-2xl bg-[#111111] border border-white/5 hover:border-[#c9a962]/30 transition-all group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] group-hover:bg-[#c9a962]/10 flex items-center justify-center transition-colors">
                                    <item.icon size={22} className="text-[#c9a962]" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[#fafaf5] mb-1">
                                        {item.label}
                                    </h3>
                                    <p className="text-sm text-[#fafaf5]/50">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Admin Link */}
                {user.is_admin && (
                    <div className="mb-8">
                        <Link
                            to="/admin"
                            className="flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#c9a962]/10 to-transparent border border-[#c9a962]/30 hover:border-[#c9a962]/50 transition-colors"
                        >
                            <div className="w-12 h-12 rounded-xl bg-[#c9a962]/20 flex items-center justify-center">
                                <Music size={22} className="text-[#c9a962]" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[#c9a962]">
                                    Admin Dashboard
                                </h3>
                                <p className="text-sm text-[#fafaf5]/50">
                                    Upload and manage content
                                </p>
                            </div>
                        </Link>
                    </div>
                )}

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-6 py-3 rounded-xl border border-white/10 text-[#fafaf5]/60 hover:border-red-500/30 hover:text-red-400 transition-colors"
                >
                    <LogOut size={18} />
                    <span>Sign out</span>
                </button>
            </div>
        </div>
    );
}
