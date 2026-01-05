/**
 * Landing Page
 * Public entry point for unauthenticated users
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Music2, Headphones, Heart, ListMusic } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Landing() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen bg-bg-primary relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-purple-500/10" />

            {/* Animated orbs */}
            <motion.div
                className="absolute top-20 left-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 5, repeat: Infinity }}
            />
            <motion.div
                className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
                transition={{ duration: 7, repeat: Infinity }}
            />

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <header className="flex items-center justify-between px-8 py-6">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                            <Music2 size={24} className="text-white" />
                        </div>
                        <span className="text-2xl font-display font-bold">Melodify</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {isAuthenticated ? (
                            <Link
                                to="/music"
                                className="px-6 py-2 bg-accent rounded-full font-medium hover:bg-accent/90 transition-colors"
                            >
                                Open App
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="px-6 py-2 text-text-secondary hover:text-text-primary transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-6 py-2 bg-accent rounded-full font-medium hover:bg-accent/90 transition-colors"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </header>

                {/* Hero Section */}
                <main className="px-8 pt-20 pb-32 max-w-6xl mx-auto">
                    <motion.div
                        className="text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
                            Your Music,{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-400">
                                Your Way
                            </span>
                        </h1>
                        <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-12">
                            Stream millions of songs, discover new artists, create playlists,
                            and enjoy podcasts—all in one beautiful experience.
                        </p>

                        <div className="flex items-center justify-center gap-4">
                            <Link
                                to="/register"
                                className="flex items-center gap-2 px-8 py-4 bg-accent rounded-full font-semibold text-lg hover:bg-accent/90 transition-all hover:scale-105"
                            >
                                <Play size={20} fill="currentColor" />
                                Start Listening Free
                            </Link>
                            <Link
                                to="/login"
                                className="px-8 py-4 glass rounded-full font-semibold text-lg hover:bg-white/10 transition-all"
                            >
                                Sign In
                            </Link>
                        </div>
                    </motion.div>

                    {/* Features Grid */}
                    <motion.div
                        className="grid md:grid-cols-3 gap-6 mt-24"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        {[
                            {
                                icon: Headphones,
                                title: 'Unlimited Music',
                                description: 'Access millions of tracks from artists worldwide',
                                color: 'from-accent/20 to-accent/5',
                            },
                            {
                                icon: ListMusic,
                                title: 'Custom Playlists',
                                description: 'Create and organize your perfect music collection',
                                color: 'from-purple-500/20 to-purple-500/5',
                            },
                            {
                                icon: Heart,
                                title: 'Personalized',
                                description: 'Discover new music tailored to your taste',
                                color: 'from-pink-500/20 to-pink-500/5',
                            },
                        ].map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                className={`p-8 rounded-2xl glass bg-gradient-to-br ${feature.color}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                            >
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                                    <feature.icon size={24} className="text-accent" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                <p className="text-text-secondary">{feature.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </main>

                {/* Footer */}
                <footer className="px-8 py-6 text-center text-text-secondary text-sm">
                    <p>© 2024 Melodify. Made with ❤️ for music lovers.</p>
                </footer>
            </div>
        </div>
    );
}
