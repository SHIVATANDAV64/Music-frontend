import { Link } from 'react-router-dom';
import { Github, Linkedin, Instagram, Mail } from 'lucide-react';

export function Footer() {
    return (
        <footer
            className="mt-20 border-t py-12 px-8 md:px-12 transition-colors duration-300"
            style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-void)'
            }}
        >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                <div className="space-y-4">
                    <h4 className="font-display text-2xl tracking-widest uppercase text-[var(--color-text-primary)]">AUDIO_OS</h4>
                    <p className="font-mono text-xs text-[var(--color-text-muted)] max-w-xs leading-relaxed">
                        High-fidelity audio processing terminal.
                        <br />System Version 3.0.1
                    </p>

                    {/* Social Links */}
                    <div className="flex items-center gap-4 pt-4">
                        <a href="https://github.com/SHIVATANDAV64" target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors">
                            <Github size={18} />
                        </a>
                        <a href="https://www.linkedin.com/in/venkatreddy64/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors">
                            <Linkedin size={18} />
                        </a>
                        <a href="https://www.instagram.com/shiva_tandav_64/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors">
                            <Instagram size={18} />
                        </a>
                        <a href="mailto:rudrashiva654@gmail.com" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors">
                            <Mail size={18} />
                        </a>
                    </div>
                </div>

                <div>
                    <h5 className="font-mono text-xs text-[var(--color-accent-gold)] uppercase tracking-widest mb-6">Navigation</h5>
                    <ul className="space-y-3 font-mono text-xs text-[var(--color-text-muted)]">
                        <li><Link to="/home" className="hover:text-[var(--color-text-primary)] transition-colors">/root/dashboard</Link></li>
                        <li><Link to="/favorites" className="hover:text-[var(--color-text-primary)] transition-colors">/lib/favorites</Link></li>
                        <li><Link to="/settings" className="hover:text-[var(--color-text-primary)] transition-colors">/sys/settings</Link></li>
                    </ul>
                </div>

                <div>
                    <h5 className="font-mono text-xs text-[var(--color-accent-gold)] uppercase tracking-widest mb-6">Legal</h5>
                    <ul className="space-y-3 font-mono text-xs text-[var(--color-text-muted)]">
                        <li className="hover:text-[var(--color-text-primary)] cursor-pointer transition-colors opacity-50">Privacy Protocol</li>
                        <li className="hover:text-[var(--color-text-primary)] cursor-pointer transition-colors opacity-50">Terms of Service</li>
                        <li className="hover:text-[var(--color-text-primary)] cursor-pointer transition-colors opacity-50">License.txt</li>
                    </ul>
                </div>

                <div>
                    <h5 className="font-mono text-xs text-[var(--color-accent-gold)] uppercase tracking-widest mb-6">Status</h5>
                    <div className="flex items-center gap-2 text-xs font-mono text-green-500">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Systems Operational
                    </div>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-2 font-mono">
                        Build Date: {new Date().toISOString().split('T')[0]}
                    </p>
                </div>
            </div>
            <div className="pt-8 border-t border-[var(--color-border)] flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-mono text-[var(--color-text-muted)] uppercase tracking-widest">
                <p>© 2026 AUDIO_OS INC. ALL RIGHTS RESERVED.</p>
                <div className="flex items-center gap-4">
                    <p>DESIGNED BY SHIVATANDAV</p>
                    <span className="w-1 h-1 bg-[var(--color-text-muted)] rounded-full" />
                    <p>MADE WITH ❤️ IN INDIA</p>
                </div>
            </div>
        </footer>
    );
}
