/**
 * Favorites Page - Sacred Collection
 * 
 * Philosophy: These are the sounds that moved the user's soul.
 * Display them with reverence, like a personal gallery.
 */
import { useState, useEffect } from 'react';
import { Heart, Music } from 'lucide-react';
import { MusicCard } from '../components/cards';
import { AmbientGlow } from '../components/ui';
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
                const data = await favoritesService.getUserFavorites(user.$id);
                setFavorites(data);
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#c9a962] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen relative">
            <AmbientGlow isActive={true} intensity={0.15} />

            <div className="max-w-7xl mx-auto px-8 py-16">
                {/* Header */}
                <div className="mb-16">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c9a962] to-[#8b6914] flex items-center justify-center">
                            <Heart size={28} fill="white" className="text-white" />
                        </div>
                        <div>
                            <p className="text-[#4a5e4a] text-xs uppercase tracking-widest mb-1">
                                Your Collection
                            </p>
                            <h1 className="text-4xl md:text-5xl font-serif text-[#fafaf5]">
                                Favorites
                            </h1>
                        </div>
                    </div>
                    <p className="text-[#fafaf5]/50 max-w-xl">
                        The sounds that moved your soul, gathered in one sacred place.
                    </p>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="p-5 rounded-2xl bg-[#111111]">
                                <div className="aspect-square rounded-xl bg-[#1a1a1a] animate-pulse mb-4" />
                                <div className="h-4 rounded bg-[#1a1a1a] animate-pulse w-3/4 mb-2" />
                                <div className="h-3 rounded bg-[#1a1a1a] animate-pulse w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="w-24 h-24 rounded-full bg-[#111111] flex items-center justify-center mb-6">
                            <Music size={40} className="text-[#fafaf5]/20" />
                        </div>
                        <h3 className="text-xl font-serif text-[#fafaf5] mb-2">
                            No favorites yet
                        </h3>
                        <p className="text-[#fafaf5]/50 text-center max-w-md">
                            As you discover music that moves you, save it here.
                            <br />
                            Each track you love becomes part of your collection.
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
