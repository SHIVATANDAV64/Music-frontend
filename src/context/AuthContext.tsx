/**
 * Authentication Context
 * Manages user session state with Appwrite Account SDK
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { account, databases, DATABASE_ID, COLLECTIONS, ID } from '../lib/appwrite';
import type { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
    signup: (email: string, password: string, username: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        isLoading: true,
        isAuthenticated: false,
    });

    // Check for existing session on mount
    useEffect(() => {
        checkSession();
    }, []);

    async function checkSession() {
        try {
            const session = await account.get();
            if (session && session.$id) {
                await fetchUserProfile(session.$id);
            } else {
                // Invalid session data
                setState({ user: null, isLoading: false, isAuthenticated: false });
            }
        } catch (error) {
            // No active session or session expired
            console.log('No active session');
            setState({ user: null, isLoading: false, isAuthenticated: false });
        }
    }

    async function fetchUserProfile(userId: string) {
        try {
            const profile = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userId
            ) as unknown as User;

            setState({
                user: profile,
                isLoading: false,
                isAuthenticated: true,
            });
        } catch (profileError) {
            console.warn('[Auth] Profile not found in DB:', profileError);

            // Critical Change: Do NOT create a fake user state.
            // Try to recover by creating the profile if the session exists
            try {
                const session = await account.get();
                if (session && session.$id === userId) {
                    console.log('[Auth] Valid session exists, attempting to create missing profile...');
                    // Attempt to create the missing document
                    await databases.createDocument(
                        DATABASE_ID,
                        COLLECTIONS.USERS,
                        userId, // Use userId as document ID
                        {
                            username: session.name || session.email.split('@')[0],
                            is_admin: false,
                        }
                    );

                    // Retry fetch
                    const newProfile = await databases.getDocument(
                        DATABASE_ID,
                        COLLECTIONS.USERS,
                        userId
                    ) as unknown as User;

                    setState({
                        user: newProfile,
                        isLoading: false,
                        isAuthenticated: true,
                    });
                    return;
                }
            } catch (recoveryError) {
                console.error('[Auth] Failed to recover user profile:', recoveryError);
            }

            // If we reach here, we failed to get or create a profile.
            // Force logout to clear the invalid session state.
            console.error('[Auth] Critical: Session exists but DB profile missing and creation failed. Logging out.');
            await logout(); // Ensure we clear state
        }
    }

    async function signup(email: string, password: string, username: string) {
        try {
            // Create account
            const newAccount = await account.create(ID.unique(), email, password, username);
            if (!newAccount || !newAccount.$id) {
                throw new Error('Account creation failed - no ID returned');
            }

            // Create session
            await account.createEmailPasswordSession(email, password);

            // Create user profile in database - STRICT REQUIREMENT
            if (!DATABASE_ID || !COLLECTIONS.USERS) {
                throw new Error('Database configuration missing');
            }

            try {
                await databases.createDocument(
                    DATABASE_ID,
                    COLLECTIONS.USERS,
                    newAccount.$id,
                    {
                        username,
                        is_admin: false,
                    }
                );
            } catch (dbError) {
                console.error('[Auth] Failed to create user profile in DB:', dbError);
                // If this fails, we effectively have a broken user. 
                // We should probably roll back (delete account) or let the fetchUserProfile handle the logout.
                // For now, allow fetchUserProfile to catch it and try one more time or logout.
            }

            await fetchUserProfile(newAccount.$id);
        } catch (error) {
            console.error('Signup error:', error);
            // Ensure we don't leave a half-baked session
            await logout();
            throw error;
        }
    }

    async function login(email: string, password: string) {
        try {
            // Clear any existing session first
            try {
                await account.deleteSession('current');
            } catch {
                // No existing session - that's fine
            }

            await account.createEmailPasswordSession(email, password);
            // Verify session immediately
            const session = await account.get();
            if (!session || !session.$id) {
                throw new Error('Failed to retrieve session after login');
            }

            await fetchUserProfile(session.$id);
        } catch (error) {
            console.error('Login error:', error);
            await logout();
            throw error;
        }
    }

    async function logout() {
        // Always clear local state first
        setState({ user: null, isLoading: false, isAuthenticated: false });

        // Then try to clear server session (ignore errors - user may not have active session)
        try {
            await account.deleteSession('current');
        } catch {
            // Session may not exist - that's fine, we already cleared local state
        }
    }

    async function refreshUser() {
        const session = await account.get();
        await fetchUserProfile(session.$id);
    }

    return (
        <AuthContext.Provider
            value={{
                ...state,
                signup,
                login,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
