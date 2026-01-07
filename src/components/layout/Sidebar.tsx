/**
 * Sidebar - Audio Architecture
 * 
 * Philosophy: Technical, Precision, Database Access.
 * Replaces organic curves with sharp edges and blueprint styling.
 */
import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Home, Search, Library, Plus,
    Heart, Music, Disc3, Upload,
    PanelLeftOpen, History,
    Settings, Database, Radio
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SIDEBAR_COLLAPSED_KEY = 'audio_os_sidebar_collapsed';

interface SidebarProps {
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
    const { user, isAuthenticated } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
        return saved === 'true';
    });

    // Persist collapse state (Desktop only)
    useEffect(() => {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
        // Update CSS variable for layout
        document.documentElement.style.setProperty(
            '--sidebar-width',
            isCollapsed ? '80px' : '280px'
        );
    }, [isCollapsed]);

    // Handle Mobile Overlay Body Scroll Lock
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    const sidebarContent = (
        <>
            {/* Header - Technical Branding */}
            <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center' : 'px-6'} border-b border-[var(--color-border)] bg-[var(--color-void)]`}>
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'} w-full`}>
                    <div className="w-10 h-10 bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)] flex items-center justify-center relative group shrink-0">
                        <div className="absolute inset-0 bg-[var(--color-accent-gold)] opacity-0 group-hover:opacity-20 transition-opacity" />
                        <Disc3 size={20} className="text-[var(--color-accent-gold)] animate-spin-slow" />

                        {/* Corner Accents */}
                        <div className="absolute top-0 left-0 w-1 h-1 bg-[var(--color-accent-gold)]" />
                        <div className="absolute bottom-0 right-0 w-1 h-1 bg-[var(--color-accent-gold)]" />
                    </div>

                    {(!isCollapsed || mobileOpen) && (
                        <div className="flex-1 min-w-0">
                            <span className="block font-display text-lg text-[var(--color-text-primary)] tracking-widest leading-none truncate">
                                AUDIO_OS
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-1.5 h-1.5 bg-[var(--color-accent-gold)] rounded-full animate-pulse" />
                                <p className="font-mono text-[9px] text-[var(--color-text-muted)] uppercase tracking-[0.2em]">
                                    System Online
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Channels */}
            <nav className="flex-1 overflow-y-auto py-6 space-y-8 scrollbar-hide">
                {/* Main Modules */}
                <div className="px-4">
                    {(!isCollapsed || mobileOpen) && (
                        <div className="px-2 mb-3 flex items-center gap-2">
                            <div className="w-1 h-1 bg-[#D4AF37]" />
                            <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">Modules</span>
                            <div className="h-[1px] flex-1 bg-white/5" />
                        </div>
                    )}
                    <div className="space-y-1">
                        <NavItem to="/home" icon={Home} label="Dashboard" collapsed={isCollapsed && !mobileOpen} code="01" onClick={onMobileClose} />
                        <NavItem to="/search" icon={Search} label="Search" collapsed={isCollapsed && !mobileOpen} code="02" onClick={onMobileClose} />
                        <NavItem to="/music" icon={Music} label="Library" collapsed={isCollapsed && !mobileOpen} code="03" onClick={onMobileClose} />
                        <NavItem to="/podcasts" icon={Radio} label="Podcasts" collapsed={isCollapsed && !mobileOpen} code="04" onClick={onMobileClose} />
                    </div>
                </div>

                {/* User Data */}
                {isAuthenticated && (
                    <div className="px-4">
                        {(!isCollapsed || mobileOpen) && (
                            <div className="px-2 mb-3 flex items-center gap-2">
                                <div className="w-1 h-1 bg-[#D4AF37]" />
                                <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">Collections</span>
                                <div className="h-[1px] flex-1 bg-white/5" />
                                <button className="text-white/30 hover:text-[#D4AF37] transition-colors">
                                    <Plus size={12} />
                                </button>
                            </div>
                        )}
                        <div className="space-y-1">
                            <NavItem to="/playlists" icon={Library} label="Playlists" collapsed={isCollapsed && !mobileOpen} code="A" onClick={onMobileClose} />
                            <NavItem to="/favorites" icon={Heart} label="Favorites" collapsed={isCollapsed && !mobileOpen} code="B" onClick={onMobileClose} />
                            <NavItem to="/history" icon={History} label="History" collapsed={isCollapsed && !mobileOpen} code="C" onClick={onMobileClose} />
                        </div>
                    </div>
                )}

                {/* System / Admin */}
                {user?.is_admin && (
                    <div className="px-4">
                        {(!isCollapsed || mobileOpen) && (
                            <div className="px-2 mb-3 flex items-center gap-2">
                                <div className="w-1 h-1 bg-red-500/50" />
                                <span className="font-mono text-[10px] text-red-500/50 uppercase tracking-widest">Restricted</span>
                                <div className="h-[1px] flex-1 bg-red-500/10" />
                            </div>
                        )}
                        <div className="space-y-1">
                            <NavItem to="/admin" icon={Upload} label="Ingest Data" collapsed={isCollapsed && !mobileOpen} code="ROOT" variant="danger" onClick={onMobileClose} />
                        </div>
                    </div>
                )}
            </nav>

            {/* Footer Control */}
            <div
                className="p-4 border-t"
                style={{
                    borderTopColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-void)'
                }}
            >
                {/* User Identity */}
                {isAuthenticated ? (
                    <div className={`
                        relative group flex items-center ${(isCollapsed && !mobileOpen) ? 'justify-center' : 'gap-3 p-3'} 
                        ${(!isCollapsed || mobileOpen) && 'border hover:border-[#D4AF37]/30 transition-colors'}
                    `}
                        style={{
                            borderColor: (!isCollapsed || mobileOpen) ? 'var(--color-border)' : 'transparent',
                            backgroundColor: (!isCollapsed || mobileOpen) ? 'var(--color-card)' : 'transparent'
                        }}
                    >
                        {/* Profile Pic / Avatar */}
                        <div className="relative w-8 h-8 flex items-center justify-center bg-[#D4AF37]/10 border border-[#D4AF37]/30 shrink-0">
                            <span className="font-mono text-xs text-[#D4AF37]">
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </span>
                            {/* Tech Corners */}
                            <div className="absolute -top-px -left-px w-1.5 h-1.5 border-l border-t border-[#D4AF37]" />
                            <div className="absolute -bottom-px -right-px w-1.5 h-1.5 border-r border-b border-[#D4AF37]" />
                        </div>

                        {(!isCollapsed || mobileOpen) && (
                            <div className="flex-1 min-w-0">
                                <p className="font-mono text-xs truncate" style={{ color: 'var(--color-text-primary)' }}>
                                    {user?.username}
                                </p>
                                <p className="font-mono text-[9px] text-[#D4AF37] uppercase tracking-wider">
                                    ID: {user?.$id?.substring(0, 6) || 'UNKNOWN'}
                                </p>
                            </div>
                        )}

                        {(!isCollapsed || mobileOpen) && (
                            <NavLink to="/settings" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={onMobileClose}>
                                <Settings size={14} className="text-white/40 hover:text-white" />
                            </NavLink>
                        )}
                    </div>
                ) : (
                    <NavLink to="/login" className="block" onClick={onMobileClose}>
                        <button className={`
                            w-full py-3 flex items-center justify-center gap-2
                            border border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]
                            hover:bg-[#D4AF37] hover:text-black transition-all duration-300
                            font-mono text-xs uppercase tracking-widest
                        `}>
                            {(isCollapsed && !mobileOpen) ? <Database size={16} /> : 'AUTHENTICATE'}
                        </button>
                    </NavLink>
                )}

                {/* Collapser - Desktop Only */}
                {!mobileOpen && (
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="w-full mt-4 flex items-center justify-center p-2 text-white/20 hover:text-[#D4AF37] transition-colors"
                    >
                        {isCollapsed ? <PanelLeftOpen size={16} /> : <div className="h-1 w-8 bg-white/10 hover:bg-[#D4AF37] transition-colors rounded-full" />}
                    </button>
                )}
            </div>
        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={`hidden md:flex fixed left-0 top-0 h-full bg-[var(--color-void)] border-r border-[var(--color-border)] flex-col transition-all duration-300 z-50 ${isCollapsed ? 'w-20' : 'w-[280px]'}`}
            >
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar Overlay */}
            <div className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={onMobileClose}
                />

                {/* Drawer */}
                <aside
                    className={`absolute left-0 top-0 bottom-0 w-[280px] bg-[var(--color-void)] border-r border-[var(--color-border)] flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
                >
                    {sidebarContent}
                </aside>
            </div>
        </>
    );
}

/**
 * NavItem - Terminal Tab Style
 */
function NavItem({
    to,
    icon: Icon,
    label,
    collapsed = false,
    code,
    variant = 'default',
    onClick
}: {
    to: string;
    icon: any;
    label: string;
    collapsed?: boolean;
    code?: string;
    variant?: 'default' | 'danger';
    onClick?: () => void;
}) {
    const activeColor = variant === 'danger' ? 'text-red-500' : 'text-[var(--color-accent-gold)]';
    const activeBorder = variant === 'danger' ? 'border-red-500' : 'border-[var(--color-accent-gold)]';
    const activeBg = variant === 'danger' ? 'bg-red-500/10' : 'bg-[var(--color-accent-gold)]/10';

    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) => `
                group relative flex items-center ${collapsed ? 'justify-center h-12 w-12 mx-auto' : 'h-10 px-3 mx-2'} 
                transition-all duration-200 border border-transparent
                ${isActive
                    ? `${activeBg} ${activeBorder} ${activeColor}`
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)] hover:bg-[var(--color-card)]'}
            `}
            title={collapsed ? label : undefined}
        >
            {({ isActive }) => (
                <>
                    {/* Active Indicator Line (Left) */}
                    {isActive && !collapsed && (
                        <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${variant === 'danger' ? 'bg-red-500' : 'bg-[var(--color-accent-gold)]'}`} />
                    )}

                    <Icon
                        size={18}
                        className={isActive ? (variant === 'danger' ? 'text-red-500' : 'text-[var(--color-accent-gold)]') : 'group-hover:text-[var(--color-text-primary)] transition-colors'}
                        strokeWidth={1.5}
                    />

                    {!collapsed && (
                        <div className="ml-3 flex-1 flex items-center justify-between">
                            <span className="font-mono text-xs uppercase tracking-wider">{label}</span>
                            {code && (
                                <span className={`font-mono text-[9px] ${isActive ? 'opacity-100' : 'opacity-20'}`}>
                                    {code}
                                </span>
                            )}
                        </div>
                    )}
                </>
            )}
        </NavLink>
    );
}

