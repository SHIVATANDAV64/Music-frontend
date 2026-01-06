/**
 * Settings Page
 * User preferences and application settings
 */
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Volume2, Monitor, Shield } from 'lucide-react';

export function Settings() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                    <SettingsIcon size={24} className="text-accent" />
                </div>
                <div>
                    <h1 className="text-3xl font-display font-bold text-white">Settings</h1>
                    <p className="text-white/60">
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
                    className="p-6 rounded-2xl bg-white/5 border border-white/5"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Volume2 className="text-accent" />
                        <h2 className="text-xl font-semibold text-white">Audio Quality</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-black/20">
                            <div>
                                <h3 className="font-medium text-white">Streaming Quality</h3>
                                <p className="text-sm text-white/50">Adjust audio bitrate for playback</p>
                            </div>
                            <select className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent">
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
                    className="p-6 rounded-2xl bg-white/5 border border-white/5"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Monitor className="text-accent" />
                        <h2 className="text-xl font-semibold text-white">Appearance</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-black/20">
                            <div>
                                <h3 className="font-medium text-white">Theme</h3>
                                <p className="text-sm text-white/50">Customize the application look</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium">Dark</button>
                                <button className="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-sm font-medium hover:bg-white/10">Light</button>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Application Info */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-2xl bg-white/5 border border-white/5"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Shield className="text-accent" />
                        <h2 className="text-xl font-semibold text-white">About</h2>
                    </div>

                    <div className="p-4 rounded-xl bg-black/20 text-white/60 text-sm space-y-2">
                        <p>Version 1.0.0 (Beta)</p>
                        <p>SoundWave is an open-source project.</p>
                    </div>
                </motion.section>
            </div>
        </div>
    );
}
