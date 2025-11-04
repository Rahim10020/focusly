'use client';

import Link from 'next/link';
import ThemeToggle from '../ui/ThemeToggle';

export default function Header() {
    return (
        <header className="w-full bg-background/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-lg">F</span>
                    </div>
                    <h1 className="text-xl font-semibold text-foreground">Focusly</h1>
                </Link>

                <nav className="flex items-center gap-6">
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
            </div>
        </header>
    );
}