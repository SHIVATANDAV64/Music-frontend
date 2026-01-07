/**
 * Authentication Context
 * Manages user session state with Appwrite Account SDK
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { account, databases, DATABASE_ID, COLLECTIONS, ID } from '../lib/appwrite';
import type { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
    register: (email: string, password: string, username: string) => Promise<void>;
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
        console.log('[Auth] fetchUserProfile started for:', userId);
        try {
            // Fetch session labels to determine admin status (Priority over DB)
            const session = await account.get();
            const hasAdminLabel = session.labels?.includes('admin') || false;

            console.log('[Auth] Getting document from:', DATABASE_ID, COLLECTIONS.USERS, userId);
            const profile = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userId
            ) as unknown as User;

            // Sync admin status if label exists but DB flag is false
            let finalProfile = profile;
            if (hasAdminLabel && !profile.is_admin) {
                console.log('[Auth] Syncing Admin Label: Updating DB is_admin to true');
                try {
                    finalProfile = await databases.updateDocument(
                        DATABASE_ID,
                        COLLECTIONS.USERS,
                        userId,
                        { is_admin: true }
                    ) as unknown as User;
                } catch (e) {
                    console.warn('[Auth] Failed to sync admin status to DB, using local override', e);
                    finalProfile = { ...profile, is_admin: true };
                }
            }

            console.log('[Auth] fetchUserProfile success:', finalProfile);
            setState({
                user: finalProfile,
                isLoading: false,
                isAuthenticated: true,
            });
        } catch (profileError) {
            console.warn('[Auth] Profile not found in DB:', profileError);

            // Critical Change: Do NOT create a fake user state.
            // Try to recover by creating the profile if the session exists
            try {
                const session = await account.get(); // Re-fetch session if we didn't get it above
                console.log('[Auth] Recovery: Found session for recovery:', session.$id);
                if (session && session.$id === userId) {
                    console.log('[Auth] Valid session exists, attempting to create missing profile...');

                    const hasAdminLabel = session.labels?.includes('admin') || false;

                    // Attempt to create the missing document
                    await databases.createDocument(
                        DATABASE_ID,
                        COLLECTIONS.USERS,
                        userId, // Use userId as document ID
                        {
                            username: session.name || session.email.split('@')[0],
                            is_admin: hasAdminLabel,
                        }
                    );

                    console.log('[Auth] Recovery: Document created, retrying fetch...');
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
                    console.log('[Auth] Recovery: Success');
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

    async function register(email: string, password: string, username: string) {
        console.log('[Auth] Signup started for:', email);
        try {
            // Create account
            console.log('[Auth] Creating account...');
            const newAccount = await account.create(ID.unique(), email, password, username);
            if (!newAccount || !newAccount.$id) {
                throw new Error('Account creation failed - no ID returned');
            }
            console.log('[Auth] Account created with ID:', newAccount.$id);

            // Create session
            console.log('[Auth] Creating session...');
            await account.createEmailPasswordSession(email, password);
            console.log('[Auth] Session created.');

            // Create user profile in database - STRICT REQUIREMENT
            if (!DATABASE_ID || !COLLECTIONS.USERS) {
                throw new Error('Database configuration missing');
            }

            try {
                console.log('[Auth] Creating user profile in DB...');
                await databases.createDocument(
                    DATABASE_ID,
                    COLLECTIONS.USERS,
                    newAccount.$id,
                    {
                        username,
                        is_admin: false,
                    }
                );
                console.log('[Auth] User profile created in DB.');
            } catch (dbError) {
                console.error('[Auth] Failed to create user profile in DB:', dbError);
                // If this fails, we effectively have a broken user. 
                // We should probably roll back (delete account) or let the fetchUserProfile handle the logout.
                // For now, allow fetchUserProfile to catch it and try one more time or logout.
            }

            await fetchUserProfile(newAccount.$id);
            console.log('[Auth] Signup process complete.');
        } catch (error: any) {
            console.error('Signup error:', error);

            // Helpful hint for misconfigured endpoints
            if (error.message && error.message.includes('<!doctype')) {
                console.error('[Appwrite CRITICAL] The server returned HTML instead of JSON. This ALMOST ALWAYS means your VITE_APPWRITE_ENDPOINT is pointed to your website URL instead of the Appwrite API. Please check your environment variables.');
            }

            // Ensure we don't leave a half-baked session
            await logout();
            throw error;
        }
    }

    async function login(email: string, password: string) {
        console.log('[Auth] Login started for:', email);
        try {
            // Clear any existing session first
            try {
                console.log('[Auth] Cleaning up old session...');
                await account.deleteSession('current');
            } catch {
                // No existing session - that's fine
            }

            console.log('[Auth] Creating new session...');
            await account.createEmailPasswordSession(email, password);

            console.log('[Auth] Verifying session...');
            // Verify session immediately
            const session = await account.get();
            console.log('[Auth] Session verified:', session.$id);
            if (!session || !session.$id) {
                // Check if we got an empty response that might be masked
                throw new Error('Failed to retrieve session after login');
            }

            await fetchUserProfile(session.$id);
            console.log('[Auth] Login process complete');
        } catch (error: any) {
            console.error('Login error:', error);

            // Helpful hint for misconfigured endpoints
            if (error.message && error.message.includes('<!doctype')) {
                console.error('[Appwrite CRITICAL] The server returned HTML instead of JSON. This ALMOST ALWAYS means your VITE_APPWRITE_ENDPOINT is pointed to your website URL instead of the Appwrite API. Please check your environment variables.');
            }

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
                register,
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
