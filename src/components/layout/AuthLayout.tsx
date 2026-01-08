
import { PillNav } from '../ui/PillNav';
import { GrainOverlay } from '../ui/GrainOverlay';
import { CliffordAttractor } from '../ui/CliffordAttractor';
import { KineticText, SplitText } from '../ui';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
    visualContent?: React.ReactNode;
}

export const AuthLayout = ({ children, title, subtitle, visualContent }: AuthLayoutProps) => {
    return (
        <div className="dark contents">
            <div className="relative min-h-screen w-full bg-void text-white font-body selection:bg-white selection:text-black">
                <GrainOverlay />
                <PillNav />

                <div className="flex min-h-screen">
                    {/* Left Side (Info) */}
                    <div className="hidden w-1/2 flex-col justify-between border-r border-white/10 p-12 lg:flex relative overflow-hidden">
                        {/* Particle Background */}
                        <div className="absolute inset-0 z-0">
                            <CliffordAttractor />
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-micro mb-8">SYSTEM: SHIVATANDAV</h4>
                            <div className="max-w-lg">
                                {visualContent ? visualContent : (
                                    <div className="mb-6">
                                        <SplitText
                                            line1="Resume"
                                            line2="Harmony."
                                            line2ClassName="text-5xl md:text-6xl lg:text-7xl whitespace-nowrap"
                                            className="mb-6"
                                        />
                                    </div>
                                )}
                                <p className="text-text-secondary text-lg max-w-md">
                                    Realign with your curated soundscape.
                                    Your library awaits.
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 grid grid-cols-2 gap-8 text-xs text-text-muted font-mono">
                            <div>
                                <span className="block text-white mb-1">STATUS</span>
                                Operational
                            </div>
                            <div>
                                <span className="block text-white mb-1">ENCRYPTION</span>
                                TLS 1.3
                            </div>
                            <div>
                                <span className="block text-white mb-1">REGION</span>
                                Global
                            </div>
                            <div>
                                <span className="block text-white mb-1">VERSION</span>
                                1.0.0
                            </div>
                        </div>
                    </div>

                    {/* Right Side (Form) */}
                    <div className="flex w-full flex-col justify-center bg-card px-4 lg:w-1/2 lg:px-24">
                        <div className="w-full max-w-md mx-auto">
                            <div className="mb-8">
                                <KineticText
                                    text={title}
                                    as="h2"
                                    type="word"
                                    className="text-2xl font-heading font-bold text-white mb-2"
                                />
                                <p className="text-text-secondary">{subtitle}</p>
                            </div>

                            <div className="bg-void border border-white/10 p-8">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
