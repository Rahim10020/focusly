'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import ThemeToggle from '../ui/ThemeToggle';
import UserMenu from '../ui/UserMenu';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { data: session } = useSession();

    return (
        <header className="w-full bg-background/95 backdrop-blur-md sticky top-0 z-50 border-b border-border/50 shadow-sm">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 group transition-all">
                    <div className="relative">
                        <img
                            src="/apple-touch-icon.png"
                            alt="Focusly Logo"
                            className="w-9 h-9 rounded-full ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all"
                        />
                    </div>
                    <h1 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        Focusly
                    </h1>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-2">
                    <Link
                        href="/dashboard"
                        className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-accent rounded-lg transition-all"
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/tasks"
                        className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-accent rounded-lg transition-all"
                    >
                        Tasks
                    </Link>
                    <Link
                        href="/calendar"
                        className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-accent rounded-lg transition-all"
                    >
                        Calendar
                    </Link>
                    <Link
                        href="/stats"
                        className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-accent rounded-lg transition-all"
                    >
                        Statistics
                    </Link>
                    <Link
                        href="/friends"
                        className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-accent rounded-lg transition-all"
                    >
                        Friends
                    </Link>
                    <Link
                        href="/leaderboard"
                        className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-accent rounded-lg transition-all"
                    >
                        Leaderboard
                    </Link>
                    <div className="ml-2 flex items-center gap-2">
                        <Link
                            href="/notifications"
                            className="p-2 rounded-full hover:bg-accent transition-colors relative"
                            aria-label="Notifications"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                        </Link>
                        <ThemeToggle />
                        <UserMenu />
                    </div>
                </nav>

                {/* Mobile Navigation */}
                <div className="md:hidden flex items-center gap-3">
                    <ThemeToggle />
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-accent transition-all focus-ring"
                        aria-label="Toggle menu"
                    >
                        <span className={`w-5 h-0.5 bg-foreground transition-all ${isMenuOpen ? 'rotate-45 translate-y-1' : ''}`}></span>
                        <span className={`w-5 h-0.5 bg-foreground transition-all my-1 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                        <span className={`w-5 h-0.5 bg-foreground transition-all ${isMenuOpen ? '-rotate-45 -translate-y-1' : ''}`}></span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-background border-t border-border animate-slide-down">
                    <nav className="flex flex-col items-stretch gap-1 p-4">
                        <Link
                            href="/dashboard"
                            className="px-4 py-3 text-sm font-medium text-foreground hover:text-primary hover:bg-accent rounded-lg transition-all text-center"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/tasks"
                            className="px-4 py-3 text-sm font-medium text-foreground hover:text-primary hover:bg-accent rounded-lg transition-all text-center"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Tasks
                        </Link>
                        <Link
                            href="/calendar"
                            className="px-4 py-3 text-sm font-medium text-foreground hover:text-primary hover:bg-accent rounded-lg transition-all text-center"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Calendar
                        </Link>
                        <Link
                            href="/stats"
                            className="px-4 py-3 text-sm font-medium text-foreground hover:text-primary hover:bg-accent rounded-lg transition-all text-center"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Statistics
                        </Link>
                        <Link
                            href="/friends"
                            className="px-4 py-3 text-sm font-medium text-foreground hover:text-primary hover:bg-accent rounded-lg transition-all text-center"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Friends
                        </Link>
                        <Link
                            href="/leaderboard"
                            className="px-4 py-3 text-sm font-medium text-foreground hover:text-primary hover:bg-accent rounded-lg transition-all text-center"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Leaderboard
                        </Link>
                        <Link
                            href="/notifications"
                            className="px-4 py-3 text-sm font-medium text-foreground hover:text-primary hover:bg-accent rounded-lg transition-all text-center"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Notifications
                        </Link>
                        <div className="pt-3 mt-2 border-t border-border flex justify-center">
                            <UserMenu />
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}