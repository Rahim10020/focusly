'use client';

import { useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '../ui/ThemeToggle';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="w-full bg-background/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-lg">F</span>
                    </div>
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
                    </nav>
                </div>
            )}
        </header>
    );
}