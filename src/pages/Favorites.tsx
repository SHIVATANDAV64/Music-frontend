/**
 * Favorites Page - Sacred Archive
 * 
 * Philosophy: A secured vault of high-value audio data.
 * Aesthetic: Deep void, gold accents, precision grid.
 */
import { useState, useEffect } from 'react';
import { Heart, Database } from 'lucide-react';
import { MusicCard } from '../components/cards';
import { favoritesService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Track } from '../types';

export function Favorites() {
    const { isAuthenticated, isLoading: authLoading, user } = useAuth();
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/login');
            return;
        }

        async function loadFavorites() {
            if (!user?.$id) return;
            try {
                const userFavorites = await favoritesService.getUserFavorites(user.$id);
                if (Array.isArray(userFavorites)) {
                    setFavorites(userFavorites);
                } else {
                    console.error("Favorites is not an array:", userFavorites);
                    setFavorites([]);
                }
            } catch (error) {
                console.error('Failed to load favorites:', error);
            } finally {
                setIsLoading(false);
            }
        }

        if (isAuthenticated && user) {
            loadFavorites();
        }
    }, [isAuthenticated, authLoading, navigate, user]);

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-void)]">
                <div className="font-mono text-xs text-[var(--color-accent-gold)] animate-pulse">AUTHENTICATING_ACCESS...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8 relative">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-end justify-between border-b border-[var(--color-border)] pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 border border-[var(--color-accent-gold)]/30 bg-[var(--color-accent-gold)]/5 flex items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[var(--color-accent-gold)]/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            <Heart size={32} className="text-[var(--color-accent-gold)] relative z-10" />

                            {/* Tech cosmetic corners */}
                            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-[var(--color-accent-gold)]" />
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-[var(--color-accent-gold)]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-mono text-[var(--color-accent-gold)] uppercase tracking-widest">
                                    // SECURE_VAULT
                                </span>
                                <div className="h-px flex-1 w-12 bg-[var(--color-accent-gold)]/30" />
                            </div>
                            <h1 className="text-4xl font-display font-bold text-[var(--color-text-primary)] uppercase tracking-widest leading-none">
                                Favorites
                            </h1>
                            <p className="font-mono text-xs text-[var(--color-text-muted)] mt-2 uppercase tracking-wider">
                                COLLECTION_SIZE: <span className="text-[var(--color-text-primary)]">{favorites.length} UNITS</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="aspect-[3/4] border border-[var(--color-border)] bg-[var(--color-card)] flex flex-col p-4 gap-4 animate-pulse">
                                <div className="aspect-square bg-[var(--color-void)] w-full" />
                                <div className="h-4 bg-[var(--color-void)] w-3/4" />
                                <div className="h-3 bg-[var(--color-void)] w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 border border-dashed border-[var(--color-border)] bg-[var(--color-card)]">
                        <div className="p-6 border border-[var(--color-border)] rounded-full mb-6 bg-[var(--color-void)]">
                            <Database size={40} className="text-[var(--color-text-muted)]" />
                        </div>
                        <h3 className="text-xl font-display text-[var(--color-text-primary)] mb-2 uppercase tracking-widest">
                            Vault Empty
                        </h3>
                        <p className="font-mono text-xs text-[var(--color-text-muted)] text-center max-w-md uppercase">
                            No audio objects detected in secure storage.
                            <br />
                            Initiate archival protocol on preferred frequencies.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {favorites.map((track) => (
                            <MusicCard key={track.$id} track={track} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
