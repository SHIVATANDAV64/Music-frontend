
import { Link } from 'react-router-dom';
import { PillNav } from '../components/ui/PillNav';
import { GrainOverlay } from '../components/ui/GrainOverlay';
import { MathPeacock } from '../components/ui/MathPeacock';
import { Footer } from '../components/layout/Footer';

export const Landing = () => {
    return (
        <div className="dark contents">
            <div className="relative min-h-screen w-full bg-void text-text-primary overflow-hidden">
                <GrainOverlay />
                <MathPeacock />
                <PillNav />

                {/* ─── Main Content ─── */}
                <main className="relative z-10 container mx-auto px-6 pt-40 pb-20">

                    {/* Hero Section */}
                    <section className="mb-40 flex flex-col items-start max-w-5xl">
                        <div className="mb-8 inline-flex items-center gap-4 border-l border-white/20 pl-4">
                            <span className="text-micro animate-pulse">SYSTEM READY</span>
                            <span className="text-micro text-white/40">///</span>
                            <span className="text-micro">INITIATING SEQUENCE</span>
                        </div>

                        <h1 className="text-hero text-7xl md:text-9xl leading-[0.85] mb-12 text-white mix-blend-difference select-none">
                            AUDIO<br />
                            ARCHITECTURE
                        </h1>

                        <div className="flex flex-col md:flex-row gap-12 items-start border-t border-white/10 pt-10 w-full">
                            <p className="text-lg md:text-xl font-light text-text-secondary max-w-md leading-relaxed font-body">
                                The bridge between global discovery and personal curation.
                                Experience a high-fidelity interface designed for audiophiles.
                            </p>

                            <div className="flex flex-col gap-4">
                                <Link to="/login" className="group flex items-center gap-4">
                                    <div className="h-12 w-12 border border-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                                        <span className="material-symbols-outlined text-xl">→</span>
                                    </div>
                                    <span className="font-mono text-sm tracking-widest group-hover:translate-x-2 transition-transform">ENTER TERMINAL</span>
                                </Link>
                                <Link to="/register" className="group flex items-center gap-4 opacity-50 hover:opacity-100 transition-opacity">
                                    <div className="h-12 w-12 border border-white/20 flex items-center justify-center">
                                        <span className="text-xl">+</span>
                                    </div>
                                    <span className="font-mono text-sm tracking-widest">REQUEST ACCESS</span>
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Technical Features Grid - "Debris" Layout */}
                    <section className="relative">
                        {/* Decoration Lines */}
                        <div className="absolute -top-20 right-0 w-px h-40 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Card 1 */}
                            <div className="group border-l border-white/10 pl-8 py-4 hover:border-white transition-colors duration-500">
                                <span className="text-micro block mb-2">01 — API STREAM</span>
                                <h3 className="text-2xl text-white font-heading font-medium mb-4">Jamendo Protocol</h3>
                                <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
                                    Direct catalog injection from Jamendo.
                                    Access 600k+ royalty-free tracks with zero latency.
                                </p>
                            </div>

                            {/* Card 2 */}
                            <div className="group border-l border-white/10 pl-8 py-4 hover:border-white transition-colors duration-500">
                                <span className="text-micro block mb-2">02 — PRIVATE CLOUD</span>
                                <h3 className="text-2xl text-white font-heading font-medium mb-4">Appwrite Storage</h3>
                                <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
                                    Secure, encrypted bucket storage for personal uploads.
                                    Your FLAC library, available everywhere.
                                </p>
                            </div>

                            {/* Card 3 */}
                            <div className="group border-l border-white/10 pl-8 py-4 hover:border-white transition-colors duration-500">
                                <span className="text-micro block mb-2">03 — DSP ENGINE</span>
                                <h3 className="text-2xl text-white font-heading font-medium mb-4">Frequency Analysis</h3>
                                <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
                                    Real-time FFT processing allows the interface to react
                                    visually to the audio spectrum.
                                </p>
                            </div>
                        </div>
                    </section>

                    <Footer />
                </main>
            </div>
        </div>
    );
};
