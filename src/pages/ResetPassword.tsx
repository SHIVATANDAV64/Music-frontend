import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/layout/AuthLayout';
import { InputGroup } from '../components/ui/InputGroup';
import { MagneticButton } from '../components/ui/MagneticButton';

export const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { confirmPasswordReset } = useAuth();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState('');

    const userId = searchParams.get('userId');
    const secret = searchParams.get('secret');

    useEffect(() => {
        if (!userId || !secret) {
            setError('Invalid or expired reset link.');
            setStatus('error');
        }
    }, [userId, secret]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || !secret) return;

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setError('');
        setStatus('loading');

        try {
            await confirmPasswordReset(userId, secret, password);
            setStatus('success');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            console.error('Password reset confirmation error:', err);
            setError(err.message || 'Failed to reset password');
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <AuthLayout
                title="Password Restored"
                subtitle="Your account access has been re-established."
            >
                <div className="text-center space-y-6">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 font-mono text-xs">
                        Password updated successfully. Redirecting to login...
                    </div>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="New Credentials"
            subtitle="Configure your new access credentials."
        >
            {error && (status === 'error' || !userId || !secret) && (
                <div className="mb-6 rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-500 border border-red-500/20">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <InputGroup
                    id="password"
                    label="New Password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={status === 'error'}
                />

                <InputGroup
                    id="confirmPassword"
                    label="Confirm New Password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={status === 'error'}
                />

                <MagneticButton
                    type="submit"
                    className="w-full !rounded-xl justify-center"
                    disabled={status === 'loading' || status === 'error'}
                >
                    {status === 'loading' ? 'Updating...' : 'Set New Password'}
                </MagneticButton>
            </form>
        </AuthLayout>
    );
};
