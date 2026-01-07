/**
 * Settings Page - System Configuration
 * 
 * Philosophy: Control panel for the audio interface.
 * Aesthetic: Industrial, modular, switches and indicators.
 */
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Volume2, Monitor, Shield, Cpu } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function Settings() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-8">
            {/* Header */}
            <div className="border-b border-[var(--color-border)] pb-6 flex items-end justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5 flex items-center justify-center relative">
                        {/* Tech corners */}
                        <div className="absolute top-0 left-0 w-1 h-1 bg-[var(--color-accent-gold)]" />
                        <div className="absolute top-0 right-0 w-1 h-1 bg-[var(--color-accent-gold)]" />
                        <div className="absolute bottom-0 left-0 w-1 h-1 bg-[var(--color-accent-gold)]" />
                        <div className="absolute bottom-0 right-0 w-1 h-1 bg-[var(--color-accent-gold)]" />
                        <SettingsIcon size={24} className="text-[var(--color-accent-gold)] animate-spin-slow" style={{ animationDuration: '10s' }} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono text-[var(--color-accent-gold)] uppercase tracking-widest">
                                // CONTROL_PANEL
                            </span>
                        </div>
                        <h1 className="text-3xl font-display font-bold text-[var(--color-text-primary)] uppercase tracking-widest leading-none">
                            System_Config
                        </h1>
                    </div>
                </div>
            </div>

            {/* Content Sections */}
            <div className="grid gap-px bg-[var(--color-border)] border border-[var(--color-border)]">
                {/* Audio Settings */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 bg-[var(--color-card)] group hover:bg-[var(--color-card-hover)] transition-colors"
                >
                    <div className="flex items-start gap-6">
                        <div className="p-3 border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-gold)] group-hover:border-[var(--color-accent-gold)]/30 transition-colors">
                            <Volume2 size={24} />
                        </div>
                        <div className="flex-1 space-y-6">
                            <div>
                                <h2 className="text-lg font-display text-[var(--color-text-primary)] uppercase tracking-widest mb-1">Audio_Stream</h2>
                                <p className="font-mono text-xs text-[var(--color-text-muted)] uppercase">Configure output bitrate & processing</p>
                            </div>

                            <div className="flex items-center justify-between p-4 border border-[var(--color-border)] bg-[var(--color-card)]/50">
                                <div>
                                    <h3 className="font-mono text-sm text-[var(--color-text-primary)] uppercase tracking-wide mb-1">Bitrate_Quality</h3>
                                    <p className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase">Select streaming bandwidth</p>
                                </div>
                                <div className="flex items-center border border-[var(--color-border)]">
                                    <select className="bg-transparent text-[var(--color-text-primary)] font-mono text-xs uppercase px-4 py-2 focus:outline-none cursor-pointer [&>option]:bg-[var(--color-card)]">
                                        <option value="high">320 KBPS [HI_RES]</option>
                                        <option value="normal">128 KBPS [STD]</option>
                                        <option value="low">64 KBPS [DATA_SAVER]</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Appearance */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-8 bg-[var(--color-card)] group hover:bg-[var(--color-card-hover)] transition-colors"
                >
                    <div className="flex items-start gap-6">
                        <div className="p-3 border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-muted)] group-hover:text-[#00F0FF] group-hover:border-[#00F0FF]/30 transition-colors">
                            <Monitor size={24} />
                        </div>
                        <div className="flex-1 space-y-6">
                            <div>
                                <h2 className="text-lg font-display text-[var(--color-text-primary)] uppercase tracking-widest mb-1">Visual_Interface</h2>
                                <p className="font-mono text-xs text-[var(--color-text-muted)] uppercase">Display mode & brightness</p>
                            </div>

                            <div className="flex items-center justify-between p-4 border border-[var(--color-border)] bg-[var(--color-card)]/50">
                                <div>
                                    <h3 className="font-mono text-sm text-[var(--color-text-primary)] uppercase tracking-wide mb-1">Theme_Mode</h3>
                                    <p className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase">Active: {theme.toUpperCase()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setTheme('dark')}
                                        className={`px-4 py-2 border font-mono text-xs uppercase tracking-wider transition-all ${theme === 'dark'
                                            ? 'bg-[var(--color-text-primary)] text-[var(--color-card)] border-[var(--color-text-primary)]'
                                            : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-primary)] hover:text-[var(--color-text-primary)]'
                                            }`}
                                    >
                                        Dark
                                    </button>
                                    <button
                                        onClick={() => setTheme('light')}
                                        className={`px-4 py-2 border font-mono text-xs uppercase tracking-wider transition-all ${theme === 'light'
                                            ? 'bg-[var(--color-text-primary)] text-[var(--color-card)] border-[var(--color-text-primary)]'
                                            : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-primary)] hover:text-[var(--color-text-primary)]'
                                            }`}
                                    >
                                        Light
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Application Info */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-8 bg-[var(--color-card)] group hover:bg-[var(--color-card-hover)] transition-colors"
                >
                    <div className="flex items-start gap-6">
                        <div className="p-3 border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] transition-colors">
                            <Cpu size={24} />
                        </div>
                        <div className="flex-1 space-y-6">
                            <div>
                                <h2 className="text-lg font-display text-[var(--color-text-primary)] uppercase tracking-widest mb-1">System_Info</h2>
                                <p className="font-mono text-xs text-[var(--color-text-muted)] uppercase">Build metadata</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 border border-[var(--color-border)] bg-[var(--color-card)]/50 flex justify-between items-center">
                                    <span className="font-mono text-xs text-[var(--color-text-muted)] uppercase">Version</span>
                                    <span className="font-mono text-xs text-[var(--color-text-primary)] uppercase">v1.0.0 [STABLE]</span>
                                </div>
                                <div className="p-4 border border-[var(--color-border)] bg-[var(--color-card)]/50 flex justify-between items-center">
                                    <span className="font-mono text-xs text-[var(--color-text-muted)] uppercase">Build</span>
                                    <span className="font-mono text-xs text-[var(--color-text-primary)] uppercase">{new Date().toISOString().split('T')[0]}</span>
                                </div>
                                <div className="col-span-2 p-4 border border-[var(--color-border)] bg-[var(--color-card)]/50 flex items-center gap-3">
                                    <Shield size={14} className="text-[var(--color-accent-gold)]" />
                                    <span className="font-mono text-[10px] text-[var(--color-text-secondary)] uppercase">
                                        Secure Connection // End-to-End Encryption
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>
            </div>
        </div>
    );
}
