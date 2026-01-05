/**
 * Landing Page - Luxury Edition
 * 
 * Philosophy: Design is not decoration. It's communication.
 * Direction: Luxury (dark, gold accents, slow motion)
 * One Thing: "Feel the premium music experience"
 */
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Play, Disc3, Headphones, Sparkles, Music2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export function Landing() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { scrollY } = useScroll();

    // Parallax effects
    const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
    const heroScale = useTransform(scrollY, [0, 400], [1, 0.9]);

    // Auto-redirect authenticated users to home
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/home');
        }
    }, [isAuthenticated, navigate]);

    return (
        <div className="min-h-screen bg-[#050505] text-[#fafaf5] overflow-hidden relative">
            {/* Grain texture overlay */}
            <div
                className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Ambient gold glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#c9a962]/10 blur-[150px] rounded-full" />

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-40 px-8 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <motion.div
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="w-10 h-10 rounded-xl bg-[#c9a962] flex items-center justify-center">
                            <Disc3 size={20} className="text-[#050505]" />
                        </div>
                        <span className="text-xl font-serif font-bold tracking-wide">SoundWave</span>
                    </motion.div>

                    <motion.nav
                        className="flex items-center gap-6"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <Link
                            to="/login"
                            className="text-sm text-[#fafaf5]/60 hover:text-[#c9a962] transition-colors uppercase tracking-widest"
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/register"
                            className="px-6 py-2.5 bg-[#c9a962] text-[#050505] rounded-full text-sm font-semibold uppercase tracking-wider hover:bg-[#d4b876] transition-colors"
                        >
                            Get Started
                        </Link>
                    </motion.nav>
                </div>
            </header>

            {/* Hero Section */}
            <motion.section
                className="min-h-screen flex flex-col items-center justify-center px-8 pt-24 relative"
                style={{ opacity: heroOpacity, scale: heroScale }}
            >
                {/* Abstract waveform visualization */}
                <motion.div
                    className="absolute inset-0 flex items-center justify-center opacity-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.2 }}
                    transition={{ duration: 2 }}
                >
                    <svg viewBox="0 0 800 200" className="w-full max-w-4xl">
                        {[...Array(40)].map((_, i) => (
                            <motion.rect
                                key={i}
                                x={i * 20}
                                y={100}
                                width="8"
                                rx="4"
                                fill="#c9a962"
                                initial={{ height: 20, y: 90 }}
                                animate={{
                                    height: [20, 40 + Math.random() * 80, 20],
                                    y: [90, 70 - Math.random() * 40, 90]
                                }}
                                transition={{
                                    duration: 2 + Math.random(),
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: i * 0.05
                                }}
                            />
                        ))}
                    </svg>
                </motion.div>

                {/* Main content */}
                <div className="relative z-10 text-center max-w-4xl mx-auto">
                    <motion.p
                        className="text-[#c9a962] text-sm uppercase tracking-[0.4em] mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        Premium Music Experience
                    </motion.p>

                    <motion.h1
                        className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold mb-8 leading-[1.1]"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        Where Sound
                        <br />
                        <span className="text-[#c9a962]">Becomes Art</span>
                    </motion.h1>

                    <motion.p
                        className="text-lg md:text-xl text-[#fafaf5]/50 max-w-2xl mx-auto mb-12 leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        Experience music visualization like never before. Stream, discover,
                        and feel every beat with our immersive audio platform.
                    </motion.p>

                    <motion.div
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                    >
                        <Link
                            to="/register"
                            className="group flex items-center gap-3 px-8 py-4 bg-[#c9a962] text-[#050505] rounded-full font-semibold text-base hover:bg-[#d4b876] transition-all hover:scale-105"
                        >
                            <Play size={18} fill="#050505" />
                            Start Listening
                            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                        </Link>
                        <Link
                            to="/login"
                            className="px-8 py-4 border border-[#fafaf5]/20 rounded-full font-semibold text-base text-[#fafaf5]/80 hover:border-[#c9a962] hover:text-[#c9a962] transition-all"
                        >
                            Sign In
                        </Link>
                    </motion.div>
                </div>

                {/* Scroll indicator */}
                <motion.div
                    className="absolute bottom-12 left-1/2 -translate-x-1/2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                >
                    <motion.div
                        className="w-6 h-10 border border-[#fafaf5]/20 rounded-full flex justify-center pt-2"
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <div className="w-1 h-2 bg-[#c9a962] rounded-full" />
                    </motion.div>
                </motion.div>
            </motion.section>

            {/* Features Section */}
            <section className="py-32 px-8 relative">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        className="text-center mb-20"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <p className="text-[#c9a962] text-sm uppercase tracking-[0.3em] mb-4">Features</p>
                        <h2 className="text-4xl md:text-5xl font-serif font-bold">Crafted for Audiophiles</h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Headphones,
                                title: 'Immersive Audio',
                                description: 'High-fidelity streaming with real-time visualization that breathes with every beat.',
                            },
                            {
                                icon: Music2,
                                title: 'Curated Discovery',
                                description: 'Explore millions of tracks from independent artists via the Jamendo catalog.',
                            },
                            {
                                icon: Sparkles,
                                title: 'Visual Symphony',
                                description: 'Watch sound transform into cymatics, waveforms, and mesmerizing patterns.',
                            },
                        ].map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                className="p-8 rounded-2xl bg-[#0a0a0a] border border-[#fafaf5]/5 hover:border-[#c9a962]/30 transition-all duration-500 group"
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                            >
                                <div className="w-14 h-14 rounded-xl bg-[#c9a962]/10 flex items-center justify-center mb-6 group-hover:bg-[#c9a962]/20 transition-colors">
                                    <feature.icon size={28} className="text-[#c9a962]" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                                <p className="text-[#fafaf5]/50 leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-8 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#c9a962]/5 to-transparent" />

                <motion.div
                    className="max-w-3xl mx-auto text-center relative"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">Ready to Experience Sound?</h2>
                    <p className="text-lg text-[#fafaf5]/50 mb-10">Join thousands of music lovers who've discovered a new way to experience their favorite tracks.</p>
                    <Link
                        to="/register"
                        className="inline-flex items-center gap-3 px-10 py-5 bg-[#c9a962] text-[#050505] rounded-full font-semibold text-lg hover:bg-[#d4b876] transition-all hover:scale-105"
                    >
                        <Play size={20} fill="#050505" />
                        Start Free Today
                    </Link>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-8 border-t border-[#fafaf5]/5">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Disc3 size={20} className="text-[#c9a962]" />
                        <span className="font-serif font-bold">SoundWave</span>
                    </div>
                    <p className="text-sm text-[#fafaf5]/30">
                        © 2024 SoundWave. Made with ♪ for music lovers.
                    </p>
                </div>
            </footer>
        </div>
    );
}
