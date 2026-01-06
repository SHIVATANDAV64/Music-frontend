/**
 * Settings Page
 * User preferences and application settings
 */
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Volume2, Monitor, Shield } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function Settings() {
    const { theme, setTheme } = useTheme();
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                    <SettingsIcon size={24} className="text-accent" />
                </div>
                <div>
                    <h1 className="text-3xl font-display font-bold text-primary">Settings</h1>
                    <p className="text-text-secondary">
                        Manage your preferences and account
                    </p>
                </div>
            </div>

            {/* Content Sections */}
            <div className="grid gap-6">
                {/* Audio Settings */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl bg-secondary border border-theme"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Volume2 className="text-accent" />
                        <h2 className="text-xl font-semibold text-primary">Audio Quality</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-primary border border-theme">
                            <div>
                                <h3 className="font-medium text-primary">Streaming Quality</h3>
                                <p className="text-sm text-text-secondary">Adjust audio bitrate for playback</p>
                            </div>
                            <select className="bg-secondary border border-theme rounded-lg px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-accent">
                                <option value="high">High (320kbps)</option>
                                <option value="normal">Normal (128kbps)</option>
                                <option value="low">Data Saver</option>
                            </select>
                        </div>
                    </div>
                </motion.section>

                {/* Appearance */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-2xl bg-secondary border border-theme"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Monitor className="text-accent" />
                        <h2 className="text-xl font-semibold text-primary">Appearance</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-primary border border-theme">
                            <div>
                                <h3 className="font-medium text-primary">Theme</h3>
                                <p className="text-sm text-text-secondary">Customize the application look</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-accent text-white' : 'bg-paper text-text-secondary hover:bg-hover'}`}
                                >
                                    Dark
                                </button>
                                <button
                                    onClick={() => setTheme('light')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${theme === 'light' ? 'bg-accent text-white' : 'bg-paper text-text-secondary hover:bg-hover'}`}
                                >
                                    Light
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Application Info */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-2xl bg-secondary border border-theme"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Shield className="text-accent" />
                        <h2 className="text-xl font-semibold text-primary">About</h2>
                    </div>

                    <div className="p-4 rounded-xl bg-primary border border-theme text-text-secondary text-sm space-y-2">
                        <p>Version 1.0.0 (Beta)</p>
                        <p>SoundWave is an open-source project.</p>
                    </div>
                </motion.section>
            </div>
        </div>
    );
}
