/**
 * Profile Page - User Dossier
 * 
 * Philosophy: Digital Identity Record.
 * Structure: Technical metadata profile.
 */
import { Heart, Clock, ListMusic, Settings, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { InputGroup } from '../components/ui/InputGroup';
import { MagneticButton } from '../components/ui/MagneticButton';

export function Profile() {
    const { user, isAuthenticated, isLoading, logout, updatePassword } = useAuth();
    const navigate = useNavigate();

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, isLoading, navigate]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        setStatus('loading');
        try {
            await updatePassword(newPassword, oldPassword);
            setStatus('success');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (err: any) {
            console.error('Password update error:', err);
            setError(err.message || 'Failed to update password');
            setStatus('error');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-void)] text-[var(--color-accent-gold)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border border-[var(--color-accent-gold)] border-t-transparent animate-spin" />
                    <span className="font-mono text-xs uppercase tracking-widest">Loading Profile Data...</span>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const menuItems = [
        { icon: Heart, label: 'Favorites', href: '/favorites', description: 'DATABASE_SAVED_ITEMS', code: 'FAV-01' },
        { icon: ListMusic, label: 'Playlists', href: '/playlists', description: 'USER_COLLECTIONS', code: 'PL-02' },
        { icon: Clock, label: 'History', href: '/history', description: 'TEMPORAL_LOGS', code: 'HST-03' },
        { icon: Settings, label: 'Settings', href: '/settings', description: 'SYSTEM_CONFIG', code: 'CFG-04' },
    ];

    return (
        <div className="min-h-screen p-8 p-12-lg">
            {/* Header / Identity Card */}
            <div className="max-w-5xl mx-auto mb-12">
                <div className="relative p-8 border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
                    {/* Background Grid */}
                    <div
                        className="absolute inset-0 bg-[size:40px_40px] pointer-events-none"
                        style={{
                            backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`
                        }}
                    />

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
                        {/* Avatar Frame */}
                        <div className="relative group">
                            <div className="w-32 h-32 bg-[var(--color-void)] border border-[var(--color-accent-gold)]/30 flex items-center justify-center p-1">
                                <div className="w-full h-full bg-[var(--color-accent-gold)]/10 flex items-center justify-center text-[var(--color-accent-gold)] font-display text-5xl">
                                    {user.username?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            </div>
                            {/* Tech Corners */}
                            <div className="absolute -top-1 -left-1 w-3 h-3 border-l border-t border-[var(--color-accent-gold)]" />
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r border-b border-[var(--color-accent-gold)]" />

                            <div className="absolute top-2 right-2 flex gap-1">
                                <div className="w-1 h-1 bg-[var(--color-accent-gold)] rounded-full animate-pulse" />
                                <div className="w-1 h-1 bg-[var(--color-accent-gold)] rounded-full animate-pulse delay-75" />
                                <div className="w-1 h-1 bg-[var(--color-accent-gold)] rounded-full animate-pulse delay-150" />
                            </div>
                        </div>

                        {/* Text Info */}
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-[10px] text-[var(--color-accent-gold)] uppercase tracking-[0.2em] border border-[var(--color-accent-gold)]/30 px-2 py-0.5">
                                    Operator Status: Active
                                </span>
                                {user.is_admin && (
                                    <span className="font-mono text-[10px] text-red-500 uppercase tracking-[0.2em] border border-red-500/30 px-2 py-0.5 flex items-center gap-2">
                                        <Shield size={10} /> Root Access
                                    </span>
                                )}
                            </div>

                            <h1 className="font-display text-4xl md:text-5xl text-[var(--color-text-primary)] tracking-wider uppercase">
                                {user.username}
                            </h1>

                            <div className="flex items-center gap-4 text-[var(--color-text-muted)] font-mono text-xs">
                                <span>ID: {user.$id}</span>
                                <span>//</span>
                                <span>MAIL: {user.email}</span>
                            </div>
                        </div>

                        {/* Sign Out Action */}
                        <button
                            onClick={handleLogout}
                            className="group flex flex-col items-end gap-1 text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
                        >
                            <LogOut size={24} />
                            <span className="font-mono text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                Terminate
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--color-border)] border border-[var(--color-border)]">
                {/* Menu Items */}
                {menuItems.map((item) => (
                    <Link
                        key={item.label}
                        to={item.href}
                        className="group relative p-8 bg-[var(--color-void)] hover:bg-[var(--color-card)] transition-colors overflow-hidden"
                    >
                        <div className="relative z-10 flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent-gold)] group-hover:border-[var(--color-accent-gold)] group-hover:bg-[var(--color-accent-gold)]/10 transition-all">
                                    <item.icon size={20} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="font-display text-lg text-[var(--color-text-primary)] mb-1 tracking-wide group-hover:text-[var(--color-accent-gold)] transition-colors">{item.label}</h3>
                                    <p className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">{item.description}</p>
                                </div>
                            </div>
                            <span className="font-mono text-[10px] text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-gold)] transition-colors">
                                {item.code}
                            </span>
                        </div>

                        {/* Corner Hover Effect */}
                        <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-r-[20px] border-t-transparent border-r-transparent group-hover:border-r-[var(--color-accent-gold)] transition-all duration-300" />
                    </Link>
                ))}

                {/* Admin Block (Full Width if odd) */}
                {user.is_admin && (
                    <Link
                        to="/admin"
                        className="md:col-span-2 group relative p-8 bg-[var(--color-void)] hover:bg-[var(--color-card)] transition-colors border-t border-[var(--color-border)]"
                    >
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 border border-[var(--color-accent-primary)]/50 flex items-center justify-center text-[var(--color-accent-primary)] group-hover:bg-[var(--color-accent-primary)]/10 transition-all">
                                    <Shield size={20} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="font-display text-lg text-[var(--color-text-primary)] mb-1 tracking-wide group-hover:text-[var(--color-accent-primary)] transition-colors">Admin Console</h3>
                                    <p className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Execute System Operations</p>
                                </div>
                            </div>
                            <span className="font-mono text-[10px] text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-primary)] transition-colors">
                                SYS-ROOT
                            </span>
                        </div>
                    </Link>
                )}
            </div>

            {/* Security Section */}
            <div className="max-w-5xl mx-auto mt-12 mb-12">
                <div className="border border-[var(--color-border)] bg-[var(--color-glass)] p-8">
                    <div className="flex items-center gap-2 mb-8">
                        <Shield size={18} className="text-[var(--color-accent-gold)]" />
                        <h2 className="font-display text-sm uppercase tracking-[0.2em] font-bold">
                            Security Protocol
                        </h2>
                    </div>

                    {status === 'success' && (
                        <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-mono rounded-sm">
                            Password updated successfully.
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono rounded-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handlePasswordUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                        <InputGroup
                            id="oldPassword"
                            label="Current Password"
                            type="password"
                            required
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                        />
                        <div className="hidden md:block" />

                        <InputGroup
                            id="newPassword"
                            label="New Password"
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <InputGroup
                            id="confirmNewPassword"
                            label="Confirm New Password"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />

                        <div className="md:col-span-2 pt-4">
                            <MagneticButton
                                type="submit"
                                disabled={status === 'loading'}
                                className="!py-3 !px-8 text-[10px] uppercase tracking-widest font-bold !rounded-xl"
                            >
                                {status === 'loading' ? 'Processing...' : 'Update Credentials'}
                            </MagneticButton>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
