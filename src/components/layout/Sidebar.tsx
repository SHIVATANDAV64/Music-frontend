/**
 * Sidebar - Organic Design
 * 
 * Philosophy: Space is silence. Generous whitespace lets music breathe.
 * Uses Fibonacci spacing: 8, 13, 21, 34, 55
 * Width follows sacred proportion for overall layout harmony.
 */
import { NavLink } from 'react-router-dom';
import {
    Home, Search, Library, Plus,
    Heart, Music, Disc3, Upload
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Sidebar() {
    const { user, isAuthenticated } = useAuth();

    return (
        <aside
            className="fixed left-0 top-0 h-full bg-[#080808] border-r border-white/5 flex flex-col"
            style={{ width: 'var(--sidebar-width)' }}
        >
            {/* Logo - Fibonacci spacing: 34px padding */}
            <div className="p-[34px]">
                <div className="flex items-center gap-[13px]">
                    <div className="w-[55px] h-[55px] rounded-[13px] bg-[var(--gold)] flex items-center justify-center shadow-lg">
                        <Disc3 size={24} className="text-[var(--bg-deep)]" />
                    </div>
                    <div>
                        <span className="text-[var(--text-xl)] font-bold font-serif text-[var(--text-primary)]">
                            SoundWave
                        </span>
                        <p className="text-[var(--text-xs)] text-[var(--text-muted)] uppercase tracking-widest">
                            Premium
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation - Fibonacci: 21px horizontal, 8px vertical */}
            <nav className="flex-1 px-[21px] space-y-[8px] overflow-y-auto">
                <NavItem to="/" icon={Home} label="Home" />
                <NavItem to="/search" icon={Search} label="Discover" />
                <NavItem to="/music" icon={Music} label="Library" />

                {/* User Collection - Fibonacci padding: 34px top */}
                {isAuthenticated && (
                    <div className="pt-[34px]">
                        <div className="flex items-center justify-between px-[13px] mb-[13px]">
                            <span className="text-[var(--text-xs)] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
                                Collection
                            </span>
                            <button className="w-[21px] h-[21px] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors">
                                <Plus size={13} />
                            </button>
                        </div>
                        <NavItem to="/playlists" icon={Library} label="Playlists" />
                        <NavItem to="/favorites" icon={Heart} label="Favorites" />
                    </div>
                )}

                {/* Admin */}
                {user?.is_admin && (
                    <div className="pt-[34px]">
                        <div className="px-[13px] mb-[13px]">
                            <span className="text-[var(--text-xs)] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
                                Admin
                            </span>
                        </div>
                        <NavItem to="/admin" icon={Upload} label="Upload" />
                    </div>
                )}
            </nav>

            {/* User - Fibonacci: 21px padding */}
            <div className="p-[21px] border-t border-white/5">
                {isAuthenticated ? (
                    <div className="flex items-center gap-[13px] p-[13px] rounded-[13px] bg-[var(--bg-card)]">
                        <div className="w-[34px] h-[34px] rounded-full bg-[var(--gold)] flex items-center justify-center text-[var(--bg-deep)] font-bold text-[var(--text-sm)]">
                            {user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[var(--text-base)] truncate">{user?.username}</p>
                            <p className="text-[var(--text-xs)] text-[var(--sage)]">Premium</p>
                        </div>
                    </div>
                ) : (
                    <NavLink to="/login" className="block">
                        <button className="w-full py-[13px] px-[21px] rounded-full bg-[var(--gold)] text-[var(--bg-deep)] font-semibold text-[var(--text-sm)] uppercase tracking-wider transition-all hover:bg-[var(--gold-light)]">
                            Sign In
                        </button>
                    </NavLink>
                )}
            </div>
        </aside>
    );
}

/**
 * NavItem - Purposeful navigation
 * Gold accent only on active/hover = "this is interactive"
 */
function NavItem({
    to,
    icon: Icon,
    label,
}: {
    to: string;
    icon: typeof Home;
    label: string;
}) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => `
                group flex items-center gap-[13px] px-[13px] py-[13px] rounded-[13px] transition-all duration-200
                ${isActive
                    ? 'bg-[var(--gold-muted)] text-[var(--gold)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'}
            `}
        >
            {({ isActive }) => (
                <>
                    <Icon
                        size={21}
                        className={isActive ? 'text-[var(--gold)]' : ''}
                        strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span className="font-medium text-[var(--text-base)]">{label}</span>

                    {/* Active indicator - sage accent for variety */}
                    {isActive && (
                        <div className="ml-auto w-[5px] h-[5px] rounded-full bg-[var(--sage)]" />
                    )}
                </>
            )}
        </NavLink>
    );
}
