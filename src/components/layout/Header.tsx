'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import ThemeToggle from '../ui/ThemeToggle';
import Button from '../ui/Button';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { data: session } = useSession();

    return (
        <header className="w-full bg-background/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <img
                        src="/apple-touch-icon.png"
                        alt="Focusly Logo"
                        className="w-8 h-8 rounded-full"
                    />
                    <h1 className="text-xl font-semibold text-foreground">Focusly</h1>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6">
                    <Link
                        href="/how-to-use"
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                        How to Use
                    </Link>
                    <Link
                        href="/stats"
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                        Statistics
                    </Link>
                    <Link
                        href="/settings"
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                        Settings
                    </Link>
                    {session && (
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                                Welcome, {session.user?.name || session.user?.email}
                            </span>
                            <Button
                                onClick={() => signOut()}
                                variant="ghost"
                                size="sm"
                            >
                                Logout
                            </Button>
                        </div>
                    )}
                    <ThemeToggle />
                </nav>

                {/* Mobile Navigation */}
                <div className="md:hidden flex items-center gap-4">
                    <ThemeToggle />
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex flex-col space-y-1 p-2"
                        aria-label="Toggle menu"
                    >
                        <span className="w-6 h-0.5 bg-foreground transition-transform"></span>
                        <span className="w-6 h-0.5 bg-foreground transition-transform"></span>
                        <span className="w-6 h-0.5 bg-foreground transition-transform"></span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-background border-t border-border">
                    <nav className="flex flex-col items-center gap-4 py-4">
                        <Link
                            href="/how-to-use"
                            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            How to Use
                        </Link>
                        <Link
                            href="/stats"
                            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Statistics
                        </Link>
                        <Link
                            href="/settings"
                            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Settings
                        </Link>
                        {session && (
                            <div className="flex flex-col items-center gap-2 pt-2 border-t border-border w-full">
                                <span className="text-sm text-muted-foreground">
                                    {session.user?.name || session.user?.email}
                                </span>
                                <Button
                                    onClick={() => signOut()}
                                    variant="ghost"
                                    size="sm"
                                    className="w-full max-w-xs"
                                >
                                    Logout
                                </Button>
                            </div>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}