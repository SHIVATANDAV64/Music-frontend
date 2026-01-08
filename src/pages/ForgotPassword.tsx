import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/layout/AuthLayout';
import { InputGroup } from '../components/ui/InputGroup';
import { MagneticButton } from '../components/ui/MagneticButton';
import { ArrowLeft } from 'lucide-react';

export const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState('');

    const { sendPasswordReset } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setStatus('loading');

        try {
            await sendPasswordReset(email);
            setStatus('success');
        } catch (err: any) {
            console.error('Password reset error:', err);
            setError(err.message || 'Failed to send reset link');
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <AuthLayout
                title="Reset Link Sent"
                subtitle="Check your inbox for further instructions."
            >
                <div className="text-center space-y-6">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 font-mono text-xs">
                        A recovery link has been dispatched to {email}. Valid for 24 hours.
                    </div>

                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-sm text-[var(--color-accent-gold)] hover:text-white transition-colors uppercase tracking-widest font-mono"
                    >
                        <ArrowLeft size={14} />
                        Back to Login
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Recover Access"
            subtitle="Initiate password reset protocol."
        >
            {error && (
                <div className="mb-6 rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-500 border border-red-500/20">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <InputGroup
                    id="email"
                    label="Email Address"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <MagneticButton
                    type="submit"
                    className="w-full !rounded-xl justify-center"
                    disabled={status === 'loading'}
                >
                    {status === 'loading' ? 'Processing...' : 'Send Recovery Link'}
                </MagneticButton>
            </form>

            <div className="mt-8 text-center">
                <Link to="/login" className="text-sm text-white/40 hover:text-white transition-colors inline-flex items-center gap-2">
                    <ArrowLeft size={14} />
                    Back to Login
                </Link>
            </div>
        </AuthLayout>
    );
};
