import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/layout/AuthLayout';
import { MagneticButton } from '../components/ui/MagneticButton';
import { Mail, CheckCircle, XCircle, ArrowRight, Loader2 } from 'lucide-react';

export function VerifyEmail() {
    const { user, sendEmailVerification, confirmEmailVerification } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error' | 'sent'>('idle');
    const [message, setMessage] = useState('');

    const userId = searchParams.get('userId');
    const secret = searchParams.get('secret');

    const [expiryTime, setExpiryTime] = useState<string | null>(null);

    useEffect(() => {
        if (user?.last_verification_sent_at) {
            const sentAt = new Date(user.last_verification_sent_at).getTime();
            const expiry = new Date(sentAt + 24 * 60 * 60 * 1000);
            setExpiryTime(expiry.toLocaleString());
        }
    }, [user]);

    useEffect(() => {
        if (userId && secret) {
            handleConfirmVerification(userId, secret);
        }
    }, [userId, secret]);


    const handleConfirmVerification = async (uid: string, sec: string) => {
        setStatus('verifying');
        try {
            await confirmEmailVerification(uid, sec);
            setStatus('success');

            // If already authenticated on this device, go home. 
            // Otherwise, go to login to show the success message.
            const destination = user ? '/home' : '/login?verified=true';
            setTimeout(() => navigate(destination), 3000);
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || 'Verification failed. The link may have expired.');
        }
    };

    const handleResend = async () => {
        setStatus('verifying');
        try {
            await sendEmailVerification();
            setStatus('sent');
            setMessage('A new activation link has been sent to your terminal.');
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || 'Failed to resend verification email.');
        }
    };

    if (userId && secret) {
        return (
            <AuthLayout
                title="VERIFYING ACCESS"
                subtitle="Authenticating your communication link..."
            >
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    {status === 'verifying' && (
                        <>
                            <Loader2 className="w-12 h-12 text-[var(--color-accent-gold)] animate-spin mb-4" />
                            <p className="font-mono text-sm text-[var(--color-text-secondary)]">PROCESS_INITIATED: VERIFYING_TOKEN</p>
                        </>
                    )}
                    {status === 'success' && (
                        <>
                            <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                            <p className="text-xl font-display mb-2">ACCESS GRANTED</p>
                            <p className="font-mono text-sm text-[var(--color-text-secondary)]">Identity verified. Please log in to access the terminal.</p>
                        </>
                    )}
                    {status === 'error' && (
                        <>
                            <XCircle className="w-12 h-12 text-red-500 mb-4" />
                            <p className="text-xl font-display mb-2">ACCESS DENIED</p>
                            <p className="font-mono text-sm text-red-400 mb-6">{message}</p>
                            <MagneticButton onClick={() => navigate('/login')} className="!px-8">
                                RETURN TO LOGIN
                            </MagneticButton>
                        </>
                    )}
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="ACTIVATE ACCOUNT"
            subtitle="Verify your email to enter the terminal."
        >
            <div className="space-y-6 pt-4">
                <div className="flex items-center gap-4 p-4 bg-[var(--color-void)] border border-[var(--color-border)]">
                    <div className="w-10 h-10 flex items-center justify-center bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)]">
                        <Mail size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-medium">Verify your email</p>
                        <p className="text-xs text-[var(--color-text-muted)] font-mono">{user?.email}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="text-sm text-[var(--color-text-secondary)] font-body leading-relaxed">
                        Account activation is mandatory. Please check your inbox and click the link we sent to gain full access to <span className="text-[var(--color-accent-gold)]">Audio_OS</span>.
                    </p>

                    {expiryTime && (
                        <div className="p-3 bg-white/5 border border-white/10 flex items-center gap-3">
                            <Loader2 size={14} className="text-[var(--color-accent-gold)]" />
                            <p className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase tracking-tight">
                                LINK EXPIRES: {expiryTime}
                            </p>
                        </div>
                    )}
                </div>

                {status === 'sent' && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-mono rounded-sm">
                        {message}
                    </div>
                )}

                {status === 'error' && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono rounded-sm">
                        {message}
                    </div>
                )}

                <div className="flex flex-col gap-4 pt-4">
                    <MagneticButton
                        onClick={handleResend}
                        disabled={status === 'verifying'}
                        className="w-full flex justify-center items-center gap-2"
                    >
                        {status === 'verifying' ? 'SENDING...' : 'RESEND VERIFICATION'}
                        <ArrowRight size={14} />
                    </MagneticButton>

                    <button
                        onClick={() => navigate('/login')}
                        className="text-[10px] uppercase tracking-widest font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors text-center"
                    >
                        LOGOUT AND RETURN
                    </button>
                </div>
            </div>
        </AuthLayout>
    );
}
