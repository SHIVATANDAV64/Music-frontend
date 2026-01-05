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
            if (session) {
                await fetchUserProfile(session.$id);
            }
        } catch {
            // No active session
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
        } catch {
            // Profile doesn't exist yet - use basic account info
            const session = await account.get();
            setState({
                user: {
                    $id: session.$id,
                    username: session.name || session.email,
                    is_admin: false,
                } as User,
                isLoading: false,
                isAuthenticated: true,
            });
        }
    }

    async function signup(email: string, password: string, username: string) {
        try {
            // Create account
            const newAccount = await account.create(ID.unique(), email, password, username);

            // Create session
            await account.createEmailPasswordSession(email, password);

            // Create user profile in database
            await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                newAccount.$id,
                {
                    username,
                    is_admin: false,
                }
            );

            await fetchUserProfile(newAccount.$id);
        } catch (error) {
            console.error('Signup error:', error);
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
            const session = await account.get();

            // Try to fetch user profile, create if missing
            try {
                await fetchUserProfile(session.$id);
            } catch {
                // User doc might not exist - create it
                try {
                    await databases.createDocument(
                        DATABASE_ID,
                        COLLECTIONS.USERS,
                        session.$id,
                        {
                            username: session.name || session.email.split('@')[0],
                            is_admin: false,
                        }
                    );
                } catch {
                    // Document might already exist or creation failed - proceed anyway
                }
                await fetchUserProfile(session.$id);
            }
        } catch (error) {
            console.error('Login error:', error);
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
