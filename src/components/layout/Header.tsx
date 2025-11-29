/**
 * @fileoverview Main header component with navigation and user controls.
 * Provides responsive navigation for both desktop and mobile devices.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ThemeToggle from '../ui/ThemeToggle';
import UserMenu from '../ui/UserMenu';
import { useNotifications } from '@/lib/hooks/useNotifications';

/**
 * Main header component that displays the application logo, navigation links,
 * theme toggle, and user menu. Includes responsive design with a mobile hamburger menu.
 *
 * @returns {JSX.Element} The header component with navigation
 *
 * @example
 * // Use in a layout component
 * function Layout({ children }) {
 *   return (
 *     <>
 *       <Header />
 *       <main>{children}</main>
 *     </>
 *   );
 * }
 *
 * @example
 * // Header automatically handles active states based on current route
 * // Navigation includes: Dashboard, Tasks, Calendar, Statistics, Friends, Leaderboard
 */
export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();
    const { data: session } = useSession();
    const { unreadCount } = useNotifications();

    return (
        <header className="w-full bg-background/95 backdrop-blur-md sticky top-0 z-50 border-b border-border/50 shadow-sm">
            <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
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
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${pathname === '/dashboard' ? 'text-primary bg-accent' : 'text-foreground hover:text-primary hover:bg-accent'}`}
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/tasks"
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${pathname === '/tasks' ? 'text-primary bg-accent' : 'text-foreground hover:text-primary hover:bg-accent'}`}
                    >
                        Tasks
                    </Link>
                    <Link
                        href="/calendar"
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${pathname === '/calendar' ? 'text-primary bg-accent' : 'text-foreground hover:text-primary hover:bg-accent'}`}
                    >
                        Calendar
                    </Link>
                    <Link
                        href="/stats"
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${pathname === '/stats' ? 'text-primary bg-accent' : 'text-foreground hover:text-primary hover:bg-accent'}`}
                    >
                        Statistics
                    </Link>
                    <Link
                        href="/friends"
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${pathname === '/friends' ? 'text-primary bg-accent' : 'text-foreground hover:text-primary hover:bg-accent'}`}
                    >
                        Friends
                    </Link>
                    <Link
                        href="/leaderboard"
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${pathname === '/leaderboard' ? 'text-primary bg-accent' : 'text-foreground hover:text-primary hover:bg-accent'}`}
                    >
                        Leaderboard
                    </Link>


                    <div className="ml-25 flex items-center gap-6">
                        <Link
                            href="/notifications"
                            className={`p-2 rounded-full transition-colors relative ${pathname === '/notifications' ? 'bg-accent' : 'hover:bg-accent'}`}
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
                            {/* ✅ AJOUT: Badge unread count */}
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
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
                        className="flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-accent transition-all focus-ring cursor-pointer"
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
                            className={`px-4 py-3 text-sm font-medium rounded-lg transition-all text-center ${pathname === '/dashboard' ? 'text-primary bg-accent' : 'text-foreground hover:text-primary hover:bg-accent'}`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/tasks"
                            className={`px-4 py-3 text-sm font-medium rounded-lg transition-all text-center ${pathname === '/tasks' ? 'text-primary bg-accent' : 'text-foreground hover:text-primary hover:bg-accent'}`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Tasks
                        </Link>
                        <Link
                            href="/calendar"
                            className={`px-4 py-3 text-sm font-medium rounded-lg transition-all text-center ${pathname === '/calendar' ? 'text-primary bg-accent' : 'text-foreground hover:text-primary hover:bg-accent'}`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Calendar
                        </Link>
                        <Link
                            href="/stats"
                            className={`px-4 py-3 text-sm font-medium rounded-lg transition-all text-center ${pathname === '/stats' ? 'text-primary bg-accent' : 'text-foreground hover:text-primary hover:bg-accent'}`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Statistics
                        </Link>
                        <Link
                            href="/friends"
                            className={`px-4 py-3 text-sm font-medium rounded-lg transition-all text-center ${pathname === '/friends' ? 'text-primary bg-accent' : 'text-foreground hover:text-primary hover:bg-accent'}`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Friends
                        </Link>
                        <Link
                            href="/leaderboard"
                            className={`px-4 py-3 text-sm font-medium rounded-lg transition-all text-center ${pathname === '/leaderboard' ? 'text-primary bg-accent' : 'text-foreground hover:text-primary hover:bg-accent'}`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Leaderboard
                        </Link>
                        <Link
                            href="/notifications"
                            className={`px-4 py-3 text-sm font-medium rounded-lg transition-all text-center ${pathname === '/notifications' ? 'text-primary bg-accent' : 'text-foreground hover:text-primary hover:bg-accent'}`}
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