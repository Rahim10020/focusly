/**
 * @fileoverview Email Verification page for the Focusly application.
 * Handles email verification tokens from Supabase and provides
 * feedback on verification status with resend functionality.
 * @module app/auth/verify-email/page
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Email Verification content component that processes verification tokens.
 * Automatically verifies OTP tokens from email links and provides
 * status feedback with auto-redirect to sign in on success.
 *
 * @returns {JSX.Element} The rendered verification status page
 */
function VerifyEmailContent() {
    const [message, setMessage] = useState('Vérification en cours...');
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    const email = searchParams.get('email');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                if (type === 'signup' && token_hash) {
                    const { error } = await supabase.auth.verifyOtp({
                        type: 'signup',
                        token_hash,
                    });

                    if (error) {
                        throw error;
                    }

                    setIsVerified(true);
                    setMessage('Votre email a été vérifié avec succès ! Redirection vers la page de connexion...');

                    // Auto-redirect after 3 seconds
                    setTimeout(() => {
                        router.push('/auth/signin');
                    }, 3000);
                }
            } catch (error) {
                setMessage('Erreur lors de la vérification de l\'email. Le lien peut avoir expiré ou est invalide.');
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        verifyEmail();
    }, [token_hash, type, router]);

    const handleContinue = () => {
        router.push('/auth/signin');
    };

    const handleResend = async () => {
        if (!email) return;

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/verify-email`,
                },
            });

            if (error) throw error;
            setMessage('Un nouvel email de vérification a été envoyé !');
        } catch (error) {
            setMessage('Erreur lors de l\'envoi de l\'email. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 transition-colors duration-200">
            <Card className="w-full max-w-md bg-transparent" variant="none">
                <CardContent className="text-center py-8">
                    <div className={`text-4xl mb-4 ${isVerified ? 'text-green-500' : 'text-yellow-500'}`}>
                        {isVerified ? '✓' : '⏳'}
                    </div>
                    <h2 className="text-xl font-semibold mb-2 text-foreground">
                        {isVerified ? 'Email Vérifié !' : 'Vérification en cours...'}
                    </h2>
                    <p className="text-muted-foreground mb-6">{message}</p>
                    {isVerified ? (
                        <Button
                            onClick={handleContinue}
                            disabled={isLoading}
                        >
                            Se connecter
                        </Button>
                    ) : (
                        email && (
                            <Button onClick={handleResend} disabled={isLoading} variant="outline" className="mt-4">
                                {isLoading ? 'Envoi en cours...' : 'Renvoyer l\'email'}
                            </Button>
                        )
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Email Verification page component wrapped in Suspense boundary.
 * This prevents client-side rendering bailout when using useSearchParams.
 *
 * @returns {JSX.Element} The rendered verification status page with Suspense
 */
export default function VerifyEmail() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <Card className="w-full max-w-md bg-transparent" variant="none">
                    <CardContent className="text-center py-8">
                        <div className="text-4xl mb-4 text-yellow-500">⏳</div>
                        <h2 className="text-xl font-semibold mb-2 text-foreground">Chargement...</h2>
                        <p className="text-muted-foreground">Vérification de votre email en cours.</p>
                    </CardContent>
                </Card>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
