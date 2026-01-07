
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/layout/AuthLayout';
import { InputGroup } from '../components/ui/InputGroup';
import { MagneticButton } from '../components/ui/MagneticButton';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/home');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Sign in to continue your journey."
        >
            {error && (
                <div className="mb-6 rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-500 border border-red-500/20">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-2">
                <InputGroup
                    id="email"
                    label="Email Address"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <InputGroup
                    id="password"
                    label="Password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <div className="flex justify-end pt-2 pb-6">
                    <button type="button" className="text-xs text-white/40 hover:text-white transition-colors">
                        Forgot Password?
                    </button>
                </div>

                <MagneticButton
                    type="submit"
                    className="w-full !rounded-xl justify-center"
                    disabled={loading}
                >
                    {loading ? 'Authenticating...' : 'Sign In'}
                </MagneticButton>
            </form>

            <div className="mt-8 text-center text-sm text-white/40">
                Don't have an account?{' '}
                <Link to="/register" className="text-neon-primary hover:text-white transition-colors border-b border-transparent hover:border-white">
                    Create one
                </Link>
            </div>
        </AuthLayout>
    );
};
