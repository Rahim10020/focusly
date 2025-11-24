/**
 * @fileoverview Sign Up page for the Focusly application.
 * Provides user registration form with email verification flow
 * using Supabase authentication.
 * @module app/auth/signup/page
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Sign Up page component for user registration.
 * Collects name, email, and password, sends verification email,
 * and provides resend functionality for verification emails.
 *
 * @returns {JSX.Element} The rendered sign up form or success message
 */
export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Écouter les changements d'authentification
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
                // L'email a été vérifié, rediriger vers signin
                router.push('/auth/signin');
            }
        });

        // Nettoyer l'écouteur au démontage du composant
        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/verify-email`,
                    data: {
                        name: name,
                    }
                },
            });

            if (error) {
                setError(error.message);
            } else {
                setSuccess(true);
                setSuccessMessage('A verification email has been sent to your email address.');
            }
        } catch (error: any) {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4 transition-colors duration-200">
                <Card className="w-full max-w-md bg-card" variant="none">
                    <CardContent className="text-center py-8">
                        <div className="text-green-500 text-4xl mb-4">✉️</div>
                        <h2 className="text-xl font-semibold mb-2 text-foreground">Registration Successful!</h2>
                        <p className="text-muted-foreground mb-4">
                            {successMessage || 'A verification email has been sent to your email address.'}
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                            Check your inbox and click the link to activate your account.
                        </p>
                        <div className="mt-4">
                            <p className="text-sm text-muted-foreground">
                                Didn't receive the email?{' '}
                                <button
                                    onClick={async () => {
                                        try {
                                            setLoading(true);
                                            const { error } = await supabase.auth.resend({
                                                type: 'signup',
                                                email,
                                                options: {
                                                    emailRedirectTo: `${window.location.origin}/auth/verify-email`,
                                                },
                                            });
                                            if (error) throw error;
                                            setSuccessMessage('A new verification email has been sent!');
                                        } catch (err) {
                                            setError('Error sending email. Please try again.');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    className="text-primary hover:underline focus:outline-none"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending...' : 'Resend Email'}
                                </button>
                            </p>
                        </div>
                        <div className="mt-6 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => router.push('/auth/signin')}
                                className="w-full"
                            >
                                <svg className="w-5 h-5 animate-arrow-slide" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                                Back to Sign In
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 transition-colors duration-200">
            <Card className="w-full max-w-md bg-transparent" variant="none">
                <CardHeader>
                    <CardTitle className="text-start text-foreground">Create Account</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium mb-1 text-foreground">
                                Name
                            </label>
                            <Input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="Your name"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1 text-foreground">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="your@email.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-1 text-foreground">
                                Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Your password"
                            />
                        </div>
                        {error && (
                            <div className="text-red-500 text-sm text-center">{error}</div>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Creating account...' : 'Create My Account'}
                            <svg className="w-5 h-5 animate-arrow-slide" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Button>
                    </form>
                    <div className="mt-4 text-center">
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <Link href="/auth/signin" className="text-brand-accent hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}