
import { Link } from 'react-router-dom';
import { PillNav } from '../components/ui/PillNav';
import { GrainOverlay } from '../components/ui/GrainOverlay';
import { MathPeacock } from '../components/ui/MathPeacock';
import { Footer } from '../components/layout/Footer';
import { KineticText, SplitText } from '../components/ui';

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

                        <div className="mb-12 select-none">
                            <SplitText
                                line1="SHIVA"
                                line2="TANDAV"
                            />
                        </div>

                        <div className="flex flex-col md:flex-row gap-12 items-start border-t border-white/10 pt-10 w-full">
                            <p className="text-lg md:text-xl font-light text-text-secondary max-w-md leading-relaxed font-body">
                                Witness sound as nature intended — patterns born from frequencies,
                                the same mathematics that bloom in flowers and spiral in galaxies.
                            </p>

                            <div className="flex flex-col gap-4">
                                <Link to="/login" className="group flex items-center gap-4">
                                    <div className="h-12 w-12 border border-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                                        <span className="text-xl">→</span>
                                    </div>
                                    <span className="font-mono text-sm tracking-widest group-hover:translate-x-2 transition-transform">ENTER EXPERIENCE</span>
                                </Link>
                                <Link to="/register" className="group flex items-center gap-4 opacity-50 hover:opacity-100 transition-opacity">
                                    <div className="h-12 w-12 border border-white/20 flex items-center justify-center">
                                        <span className="text-xl">+</span>
                                    </div>
                                    <span className="font-mono text-sm tracking-widest">BEGIN CURATION</span>
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
                                <span className="text-micro block mb-2">01 — DISCOVERY</span>
                                <KineticText text="Jamendo Stream" as="h3" className="text-2xl text-white font-heading font-medium mb-4" />
                                <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
                                    Tap into a boundless creative commons — 600,000+ tracks
                                    flowing directly into your experience, uncompressed.
                                </p>
                            </div>

                            {/* Card 2 */}
                            <div className="group border-l border-white/10 pl-8 py-4 hover:border-white transition-colors duration-500">
                                <span className="text-micro block mb-2">02 — PRESERVATION</span>
                                <KineticText text="Appwrite Vault" as="h3" className="text-2xl text-white font-heading font-medium mb-4" />
                                <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
                                    Your personal archive, encrypted and lossless.
                                    Upload, organize, and access your FLAC library from anywhere.
                                </p>
                            </div>

                            {/* Card 3 */}
                            <div className="group border-l border-white/10 pl-8 py-4 hover:border-white transition-colors duration-500">
                                <span className="text-micro block mb-2">03 — VISUALIZATION</span>
                                <KineticText text="Cymatic Rendering" as="h3" className="text-2xl text-white font-heading font-medium mb-4" />
                                <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
                                    Real-time frequency analysis transforms sound into geometry.
                                    Witness the mathematics hidden within every melody.
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
