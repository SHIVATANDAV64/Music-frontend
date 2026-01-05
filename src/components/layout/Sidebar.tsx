/**
 * Sidebar - Organic Design with Collapse
 * 
 * Philosophy: Space is silence. Generous whitespace lets music breathe.
 * Uses Fibonacci spacing: 8, 13, 21, 34, 55
 * Width follows sacred proportion for overall layout harmony.
 */
import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Home, Search, Library, Plus,
    Heart, Music, Disc3, Upload,
    PanelLeftClose, PanelLeftOpen, History
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SIDEBAR_COLLAPSED_KEY = 'soundwave_sidebar_collapsed';

export function Sidebar() {
    const { user, isAuthenticated } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
        return saved === 'true';
    });

    // Persist collapse state
    useEffect(() => {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
        // Update CSS variable for layout
        document.documentElement.style.setProperty(
            '--sidebar-width',
            isCollapsed ? '80px' : '280px'
        );
    }, [isCollapsed]);

    return (
        <aside
            className={`fixed left-0 top-0 h-full bg-[#080808] border-r border-white/5 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-[280px]'
                }`}
        >
            {/* Logo - Fibonacci spacing: 34px padding */}
            <div className={`p-[21px] ${isCollapsed ? 'flex justify-center' : ''}`}>
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-[13px]'}`}>
                    <div className="w-[45px] h-[45px] rounded-[13px] bg-[var(--gold)] flex items-center justify-center shadow-lg flex-shrink-0">
                        <Disc3 size={20} className="text-[var(--bg-deep)]" />
                    </div>
                    {!isCollapsed && (
                        <div>
                            <span className="text-lg font-bold font-serif text-[var(--text-primary)]">
                                SoundWave
                            </span>
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">
                                Premium
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation - Fibonacci: 21px horizontal, 8px vertical */}
            <nav className={`flex-1 ${isCollapsed ? 'px-3' : 'px-[21px]'} space-y-[8px] overflow-y-auto`}>
                <NavItem to="/home" icon={Home} label="Home" collapsed={isCollapsed} />
                <NavItem to="/search" icon={Search} label="Discover" collapsed={isCollapsed} />
                <NavItem to="/music" icon={Music} label="Library" collapsed={isCollapsed} />

                {/* User Collection - Fibonacci padding: 34px top */}
                {isAuthenticated && (
                    <div className="pt-[34px]">
                        {!isCollapsed && (
                            <div className="flex items-center justify-between px-[13px] mb-[13px]">
                                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
                                    Collection
                                </span>
                                <button className="w-[21px] h-[21px] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors">
                                    <Plus size={13} />
                                </button>
                            </div>
                        )}
                        <NavItem to="/playlists" icon={Library} label="Playlists" collapsed={isCollapsed} />
                        <NavItem to="/favorites" icon={Heart} label="Favorites" collapsed={isCollapsed} />
                        <NavItem to="/history" icon={History} label="History" collapsed={isCollapsed} />
                    </div>
                )}

                {/* Admin */}
                {user?.is_admin && (
                    <div className="pt-[34px]">
                        {!isCollapsed && (
                            <div className="px-[13px] mb-[13px]">
                                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
                                    Admin
                                </span>
                            </div>
                        )}
                        <NavItem to="/admin" icon={Upload} label="Upload" collapsed={isCollapsed} />
                    </div>
                )}
            </nav>

            {/* Collapse Toggle */}
            <div className={`p-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--gold)] hover:bg-white/5 transition-all"
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                </button>
            </div>

            {/* User - Fibonacci: 21px padding */}
            <div className={`p-[21px] border-t border-white/5 ${isCollapsed ? 'flex justify-center' : ''}`}>
                {isAuthenticated ? (
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-[13px] p-[13px] rounded-[13px] bg-[var(--bg-card)]'}`}>
                        <div className="w-[34px] h-[34px] rounded-full bg-[var(--gold)] flex items-center justify-center text-[var(--bg-deep)] font-bold text-sm flex-shrink-0">
                            {user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{user?.username}</p>
                                <p className="text-[10px] text-[var(--sage)]">Premium</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <NavLink to="/login" className="block">
                        <button className={`py-[13px] rounded-full bg-[var(--gold)] text-[var(--bg-deep)] font-semibold text-sm uppercase tracking-wider transition-all hover:bg-[var(--gold-light)] ${isCollapsed ? 'w-10 h-10 p-0 flex items-center justify-center' : 'w-full px-[21px]'
                            }`}>
                            {isCollapsed ? '→' : 'Sign In'}
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
    collapsed = false,
}: {
    to: string;
    icon: typeof Home;
    label: string;
    collapsed?: boolean;
}) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => `
                group flex items-center ${collapsed ? 'justify-center' : 'gap-[13px]'} px-[13px] py-[13px] rounded-[13px] transition-all duration-200
                ${isActive
                    ? 'bg-[var(--gold-muted)] text-[var(--gold)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'}
            `}
            title={collapsed ? label : undefined}
        >
            {({ isActive }) => (
                <>
                    <Icon
                        size={21}
                        className={isActive ? 'text-[var(--gold)]' : ''}
                        strokeWidth={isActive ? 2.5 : 2}
                    />
                    {!collapsed && (
                        <span className="font-medium text-sm">{label}</span>
                    )}

                    {/* Active indicator - sage accent for variety */}
                    {isActive && !collapsed && (
                        <div className="ml-auto w-[5px] h-[5px] rounded-full bg-[var(--sage)]" />
                    )}
                </>
            )}
        </NavLink>
    );
}

