
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/layout/AuthLayout';
import { InputGroup } from '../components/ui/InputGroup';
import { MagneticButton } from '../components/ui/MagneticButton';

export const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register(email, password, name);
            navigate('/home');
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const visualContent = (
        <>
            <h2 className="text-hero text-6xl font-bold mb-6">Join The<br />Collective.</h2>
            <p className="text-lg text-white/60 font-light leading-relaxed">
                Create your profile and start curating your personal soundscape today.
            </p>
        </>
    );

    return (
        <AuthLayout
            title="Create Account"
            subtitle="Begin your sonic journey."
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
