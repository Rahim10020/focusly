'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function UserMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const { data: session } = useSession();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (!session) return null;

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 hover:opacity-80 cursor-pointer transition-opacity"
            >
                <img
                    src={session.user?.image || '/default-avatar.svg'}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                />
                <span className={`text-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-md shadow-lg z-50">
                    <div className="py-1">
                        <Link
                            href="/profile"
                            className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Profile
                        </Link>
                        <Link
                            href="/settings"
                            className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Settings
                        </Link>
                        <Link
                            href="/how-to-use"
                            className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            How to Use
                        </Link>
                        <div className="my-1 border-t border-border"></div>
                        <button
                            onClick={() => {
                                signOut();
                                setIsOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}