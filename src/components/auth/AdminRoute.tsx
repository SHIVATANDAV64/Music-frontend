/**
 * Admin Route Component
 * Protects admin-only routes
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface AdminRouteProps {
    children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
    const { user, isAuthenticated, isLoading } = useAuth();

    // Show nothing while checking auth status
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-primary">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Redirect to home if not admin
    if (!user?.is_admin) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
