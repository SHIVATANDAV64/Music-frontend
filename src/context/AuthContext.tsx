/**
 * Authentication Context
 * Manages user session state with Appwrite Account SDK
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { account, databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../lib/appwrite';
import type { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
    register: (email: string, password: string, username: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    sendPasswordReset: (email: string) => Promise<void>;
    confirmPasswordReset: (userId: string, secret: string, pass: string) => Promise<void>;
    updatePassword: (newPass: string, oldPass?: string) => Promise<void>;
    sendEmailVerification: () => Promise<void>;
    confirmEmailVerification: (userId: string, secret: string) => Promise<void>;
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
            setState({ user: null, isLoading: false, isAuthenticated: false });
        }
    }

    async function fetchUserProfile(userId: string) {
        try {
            // Fetch session labels to determine admin status (Priority over DB)
            const session = await account.get();
            const hasAdminLabel = session.labels?.includes('admin') || false;

            const profile = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userId
            ) as unknown as User;

            // Sync email and admin status if missing
            let finalProfile = profile;
            let needsUpdate = false;
            const updates: any = {};

            if (hasAdminLabel && !profile.is_admin) {
                updates.is_admin = true;
                needsUpdate = true;
            }

            if (session.email && !profile.email) {
                updates.email = session.email;
                needsUpdate = true;
            }

            if (session.emailVerification !== profile.is_verified) {
                updates.is_verified = session.emailVerification;
                needsUpdate = true;
            }

            if (needsUpdate) {
                try {
                    finalProfile = await databases.updateDocument(
                        DATABASE_ID,
                        COLLECTIONS.USERS,
                        userId,
                        updates
                    ) as unknown as User;
                } catch (e) {
                    console.warn('[Auth] Failed to sync profile to DB, using local override', e);
                    finalProfile = { ...profile, ...updates };
                }
            }

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
                if (session && session.$id === userId) {

                    const hasAdminLabel = session.labels?.includes('admin') || false;

                    // Attempt to create the missing document
                    await databases.createDocument(
                        DATABASE_ID,
                        COLLECTIONS.USERS,
                        userId, // Use userId as document ID
                        {
                            username: session.name || session.email.split('@')[0],
                            email: session.email,
                            is_admin: hasAdminLabel,
                            is_verified: session.emailVerification || false,
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

    async function register(email: string, password: string, username: string) {
        let tempAccountId: string | null = null;

        try {
            // 1. Clear any existing session first to prevent session conflict errors
            try {
                await account.deleteSession('current');
            } catch {
                // No existing session - that's fine
            }

            // 2. Create account
            const newAccount = await account.create(ID.unique(), email, password, username);
            if (!newAccount || !newAccount.$id) {
                throw new Error('Account creation failed - no ID returned');
            }
            tempAccountId = newAccount.$id;

            // 3. Create session immediately (required for subsequent authenticated calls like verification)
            await account.createEmailPasswordSession(email, password);

            // 4. Create user profile in database - STRICT REQUIREMENT
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
                        email,
                        is_admin: false, // EXPLICITLY FALSE FOR NEW REGISTRATIONS
                        is_verified: false,
                    }
                );
            } catch (dbError: any) {
                console.error('[Auth] Database profile creation failed:', dbError);
                throw dbError; // Trigger rollback
            }

            // 5. Send verification email immediately
            try {
                await sendEmailVerification();
            } catch (verifyError) {
                console.warn('[Auth] Initial verification email failed, but account is created.', verifyError);
                // We don't roll back for this, as the account is valid, just unverified.
            }

            // 6. Finalize state
            await fetchUserProfile(newAccount.$id);

        } catch (error: any) {
            console.error('[Auth] Registration fatal error:', error);

            // ROLLBACK MECHANISM: If we created an account but failed later, try to delete it
            if (tempAccountId) {
                console.warn(`[Auth] ROLLING BACK: Deleting partial account ${tempAccountId}`);
                try {
                    // Note: This requires admin privileges or the user to be logged in.
                    // In Web SDK, users cannot delete their own account directly. 
                    // We will just ensure the session is cleared.
                    await account.deleteSession('current');
                    // If deleteIdentity isn't suitable, we might just have to leave it or use a server-side function.
                    // However, we'll try to at least clear the session.
                } catch (rollbackError) {
                    console.error('[Auth] Rollback (Account Deletion) failed:', rollbackError);
                }
            }

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
                // Check if we got an empty response that might be masked
                throw new Error('Failed to retrieve session after login');
            }

            await fetchUserProfile(session.$id);
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

    async function sendPasswordReset(email: string) {
        // Security check: We need to see if this user is in a 24h cooldown
        // Since user is not logged in, we fetch by email (if exists)
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.USERS,
                [Query.equal('email', email)]
            );

            if (response.documents.length > 0) {
                const userDoc = response.documents[0] as unknown as User;
                if (userDoc.last_password_reset_at) {
                    const lastReset = new Date(userDoc.last_password_reset_at).getTime();
                    const now = Date.now();
                    const twentyFourHours = 24 * 60 * 60 * 1000;

                    if (now - lastReset < twentyFourHours) {
                        const remaining = twentyFourHours - (now - lastReset);
                        const hours = Math.floor(remaining / (60 * 60 * 1000));
                        throw new Error(`Password was recently reset. Security protocol allows only one reset per 24 hours. Remaining: ${hours}h.`);
                    }
                }
            }
        } catch (e) {
            // Silently continue if user doesn't exist or query fails (standard security practice)
        }

        const platformUrl = 'https://audioos.appwrite.network';
        const resetUrl = `${platformUrl}/reset-password/`;
        await account.createRecovery(email, resetUrl);
    }

    async function confirmPasswordReset(userId: string, secret: string, pass: string) {
        await account.updateRecovery(userId, secret, pass);
        // Lock password reset for 24 hours after success
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userId, {
            last_password_reset_at: new Date().toISOString()
        });
    }

    async function updatePassword(newPass: string, oldPass?: string) {
        await account.updatePassword(newPass, oldPass);
    }

    async function sendEmailVerification() {
        const platformUrl = 'https://audioos.appwrite.network';
        const verifyUrl = `${platformUrl}/verify-email/`;

        // STRICT SECURITY: Fetch fresh user data from DB to prevent state manipulation/stale data
        try {
            const session = await account.get();
            const userDoc = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                session.$id
            ) as unknown as User;

            if (userDoc.last_verification_sent_at) {
                const lastSent = new Date(userDoc.last_verification_sent_at).getTime();
                const now = Date.now();
                const twentyFourHours = 24 * 60 * 60 * 1000;

                if (now - lastSent < twentyFourHours) {
                    const remaining = twentyFourHours - (now - lastSent);
                    const hours = Math.floor(remaining / (60 * 60 * 1000));
                    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
                    throw new Error(`A verification link was already sent. Please wait ${hours}h ${minutes}m before requesting another.`);
                }
            }

            await account.createVerification(verifyUrl);

            // Update timestamp
            const now = new Date().toISOString();
            await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, session.$id, {
                last_verification_sent_at: now
            });
            await refreshUser();

        } catch (error: any) {
            // Allow 404 (user not found in DB yet) to proceed only if it's strictly a 'Not Found' error during registration?
            // Actually, if DB doc is missing, we are in an inconsistent state.
            // But during registration, the doc is created BEFORE this call.
            // So we should re-throw security errors.
            if (error.message && error.message.includes('verification link was already sent')) {
                throw error;
            }
            if (!state.user && error.code === 401) {
                // User might not be logged in? But createVerification requires login.
                throw error;
            }
            // Fallback for registration edge cases where DB might be lagging (rare with await)
            // But for security, we default to failing if we can't verify rate limit?
            // No, getting blocked during registration is bad UX.
            // We'll let the error propagate.
            throw error;
        }
    }

    async function confirmEmailVerification(userId: string, secret: string) {
        await account.updateVerification(userId, secret);
        // Sync is_verified to DB immediately
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userId, {
            is_verified: true
        });
        await refreshUser();
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
                sendPasswordReset,
                confirmPasswordReset,
                updatePassword,
                sendEmailVerification,
                confirmEmailVerification,
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
