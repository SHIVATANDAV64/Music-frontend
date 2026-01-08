
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/layout/AuthLayout';
import { InputGroup } from '../components/ui/InputGroup';
import { MagneticButton } from '../components/ui/MagneticButton';
import { SplitText } from '../components/ui';

export const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/home');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await register(email, password, name);
            navigate('/verify-email');
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const visualContent = (
        <>
            <SplitText
                line1="Join The"
                line2="Equation."
                className="mb-6"
            />
            <p className="text-lg text-white/60 font-light leading-relaxed">
                Add your unique variable to the infinite composition.
                Your soundscape begins here.
            </p>
        </>
    );

    return (
        <AuthLayout
            title="Create Profile"
            subtitle="Define your presence in the sonic matrix."
            visualContent={visualContent}
        >
            {error && (
                <div className="mb-6 rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-500 border border-red-500/20">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <InputGroup
                    id="name"
                    label="Full Name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <InputGroup
                    id="email"
                    label="Email Address"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <InputGroup
                    id="password"
                    label="Password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <InputGroup
                    id="confirmPassword"
                    label="Confirm Password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <div className="pt-6">
                    <MagneticButton
                        type="submit"
                        className="w-full !rounded-xl justify-center"
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Get Started'}
                    </MagneticButton>
                </div>
            </form>

            <div className="mt-8 text-center text-sm text-white/40">
                Already have an account?{' '}
                <Link to="/login" className="text-neon-primary hover:text-white transition-colors border-b border-transparent hover:border-white">
                    Sign in
                </Link>
            </div>
        </AuthLayout>
    );
};
