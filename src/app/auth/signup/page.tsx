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
                    data: {
                        name: name,
                    },
                },
            });

            if (error) {
                setError(error.message);
            } else {
                setSuccess(true);
                // Redirect to signin after a delay
                setTimeout(() => {
                    router.push('/auth/signin');
                }, 2000);
            }
        } catch (error: any) {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <Card className="w-full max-w-md">
                    <CardContent className="text-center py-8">
                        <div className="text-green-500 text-4xl mb-4">✓</div>
                        <h2 className="text-xl font-semibold mb-2">Account Created!</h2>
                        <p className="text-muted-foreground">
                            Please check your email to verify your account, then sign in.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            {/* Floating Feature Cards - Background */}
            <div className="absolute inset-0 max-w-7xl mx-auto px-6 pointer-events-none">
                <div className="relative h-full">
                    {/* Left Card - Pomodoro Timer */}
                    <div className="absolute left-0 top-1/7 w-90 opacity-70 blur-[0.1px] scale-90 animate-float">
                        <Card variant="elevated" className="group">
                            <CardContent className="p-6 text-center">
                                <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-2xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Pomodoro Timer</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Stay focused with customizable 25-minute work sessions followed by refreshing breaks.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Top Card - Smart Task Management */}
                    <div className="absolute right-10 top-1/7 w-90 opacity-70 blur-[0.1px] scale-90 animate-float-delayed">
                        <Card variant="elevated" className="group">
                            <CardContent className="p-6 text-center">
                                <div className="w-12 h-12 mx-auto mb-3 bg-brand-secondary/10 rounded-2xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-brand-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Smart Task Management</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Organize tasks by priority, add sub-tasks, and track your progress with detailed insights.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Bottom Card - Achievements */}
                    <div className="absolute right-0 bottom-1/4 w-90 opacity-70 blur-[0.1px] scale-90 animate-float-slow">
                        <Card variant="elevated" className="group">
                            <CardContent className="p-6 text-center">
                                <div className="w-12 h-12 mx-auto mb-3 bg-brand-accent/10 rounded-2xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Achievements & Stats</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Build streaks, unlock achievements, and compete with friends on the leaderboard.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center">Create Account</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium mb-1">
                                Name
                            </label>
                            <Input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="Enter your name"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Enter your email"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-1">
                                Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Enter your password"
                            />
                        </div>
                        {error && (
                            <div className="text-red-500 text-sm text-center">{error}</div>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Creating account...' : 'Create Account'}
                        </Button>
                    </form>
                    <div className="mt-4 text-center">
                        <p className="text-sm">
                            Already have an account?{' '}
                            <Link href="/auth/signin" className="text-primary hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}