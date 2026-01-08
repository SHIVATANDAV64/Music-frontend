/**
 * Protected Route Component
 * Redirects unauthenticated users to login
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-void font-mono text-xs text-text-muted">
                <div className="space-y-4 text-center">
                    <div className="w-12 h-12 border border-white/10 flex items-center justify-center mx-auto">
                        <div className="w-2 h-2 bg-white animate-pulse" />
                    </div>
                    <div className="tracking-widest uppercase animate-pulse">Authenticating_Identity...</div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Redirect to verification if not verified
    // We only skip verification for the verification page itself (handled by router config usually)
    if (!user?.is_verified) {
        return <Navigate to="/verify-email" replace />;
    }

    return <>{children}</>;
}
