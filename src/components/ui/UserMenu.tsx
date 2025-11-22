/**
 * @fileoverview User menu dropdown component with profile, settings, and logout options.
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { FocusEvent } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { createPortal } from 'react-dom';

/**
 * A dropdown menu component for authenticated users.
 * Displays user avatar and provides navigation to profile, settings, and logout.
 * Supports both click and hover interactions with smooth animations.
 *
 * @returns {JSX.Element|null} The rendered user menu or null if not authenticated
 *
 * @example
 * // In a header component
 * <header>
 *   <nav>
 *     <UserMenu />
 *   </nav>
 * </header>
 */
export default function UserMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
    const { data: session } = useSession();
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuContainerRef = useRef<HTMLDivElement>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const updateMenuPosition = useCallback(() => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const header = document.querySelector('header');
            const headerHeight = header?.offsetHeight || 0;
            
            setMenuPosition({
                top: headerHeight,
                right: window.innerWidth - rect.right,
            });
        }
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            if (
                buttonRef.current?.contains(target) ||
                menuContainerRef.current?.contains(target)
            ) {
                return;
            }
            setIsOpen(false);
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            updateMenuPosition();
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, updateMenuPosition]);

    useEffect(() => {
        function handleResize() {
            if (isOpen) {
                updateMenuPosition();
            }
        }

        function handleScroll() {
            if (isOpen) {
                updateMenuPosition();
            }
        }

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen, updateMenuPosition]);

    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, []);

    function handleMouseEnter() {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        setIsOpen(true);
    }

    function handleMouseLeave() {
        hoverTimeoutRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 150);
    }

    if (!session) return null;

    const menuContent = isOpen ? (
        <div
            ref={menuContainerRef}
            className="fixed w-48 bg-background border border-border rounded-md shadow-lg z-50 animate-menu-drop"
            style={{
                top: `${menuPosition.top}px`,
                right: `${menuPosition.right}px`,
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
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
                    className="block w-full cursor-pointer text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                    Logout
                </button>
            </div>
        </div>
    ) : null;

    return (
        <>
            <div
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onFocus={() => setIsOpen(true)}
                onBlur={(event: FocusEvent<HTMLDivElement>) => {
                    const nextTarget = event.relatedTarget as Node | null;
                    if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
                        setTimeout(() => {
                            if (document.activeElement !== buttonRef.current && !menuContainerRef.current?.contains(document.activeElement)) {
                                setIsOpen(false);
                            }
                        }, 0);
                    }
                }}
            >
                <button
                    ref={buttonRef}
                    onClick={() => setIsOpen(!isOpen)}
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    className="flex items-center gap-2 hover:opacity-80 cursor-pointer transition-opacity"
                >
                    <img
                        src={session.user?.image || '/default-avatar.svg'}
                        alt="Profile"
                        className="w-8 h-8 rounded-full"
                    />
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`text-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    >
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </button>
            </div>
            {typeof window !== 'undefined' && createPortal(menuContent, document.body)}
        </>
    );
}