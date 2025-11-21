'use client';

import { useState } from 'react';
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

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

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
                setSuccessMessage('Un email de vérification a été envoyé à votre adresse email.');
            }
        } catch (error: any) {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background dark:bg-slate-900 px-4 transition-colors duration-200">
                <Card className="w-full max-w-md" variant="none">
                    <CardContent className="text-center py-8">
                        <div className="text-green-500 text-4xl mb-4">✉️</div>
                        <h2 className="text-xl font-semibold mb-2 dark:text-white">Inscription réussie !</h2>
                        <p className="text-muted-foreground dark:text-gray-300 mb-4">
                            {successMessage || 'Un email de vérification a été envoyé à votre adresse email.'}
                        </p>
                        <p className="text-sm text-muted-foreground dark:text-gray-400 mb-4">
                            Vérifiez votre boîte de réception et cliquez sur le lien pour activer votre compte.
                        </p>
                        <div className="mt-4">
                            <p className="text-sm text-muted-foreground dark:text-gray-400">
                                Vous n'avez pas reçu l'email ?{' '}
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
                                            setSuccessMessage('Un nouvel email de vérification a été envoyé !');
                                        } catch (err) {
                                            setError('Erreur lors de l\'envoi de l\'email. Veuillez réessayer.');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    className="text-primary hover:underline focus:outline-none dark:text-brand-accent"
                                    disabled={loading}
                                >
                                    {loading ? 'Envoi en cours...' : 'Renvoyer l\'email'}
                                </button>
                            </p>
                        </div>
                        <div className="mt-6 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => router.push('/auth/signin')}
                                className="w-full"
                            >
                                Retour à la connexion
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background dark:bg-slate-900 px-4 transition-colors duration-200">
            <Card className="w-full max-w-md bg-transparent" variant="none">
                <CardHeader>
                    <CardTitle className="text-start dark:text-white">Créer un compte</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium mb-1 dark:text-gray-300">
                                Nom
                            </label>
                            <Input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="Votre nom"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1 dark:text-gray-300">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="votre@email.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-1 dark:text-gray-300">
                                Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Votre mot de passe"
                            />
                        </div>
                        {error && (
                            <div className="text-red-500 text-sm text-center">{error}</div>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Création du compte...' : 'Créer mon compte'}
                        </Button>
                    </form>
                    <div className="mt-4 text-center">
                        <p className="text-sm dark:text-gray-300">
                            Vous avez déjà un compte ?{' '}
                            <Link href="/auth/signin" className="text-primary hover:underline dark:text-brand-accent">
                                Se connecter
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}