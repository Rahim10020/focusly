/**
 * @fileoverview Main header component with navigation and user controls.
 * Provides responsive navigation for both desktop and mobile devices.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "../shared/ThemeToggle";
import UserMenu from "../shared/UserMenu";
import { useNotificationsContext } from "@/components/providers/NotificationsProvider";
import { ROUTES } from "@/constants";
import AppLogo from "../shared/AppLogo";
import { BellIcon } from "@/components/shared/icons";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { unreadCount } = useNotificationsContext();

  return (
    <header className="w-full bg-background/95 backdrop-blur-md sticky top-0 z-50 border-b border-border/50 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <AppLogo iconSize={32} md={true} />
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <Link
            href={ROUTES.TASKS}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${pathname === ROUTES.TASKS ? "text-primary bg-accent" : "text-foreground hover:text-primary hover:bg-accent"}`}
          >
            Tasks
          </Link>
          <Link
            href={ROUTES.DASHBOARD}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${pathname === ROUTES.DASHBOARD ? "text-primary bg-accent" : "text-foreground hover:text-primary hover:bg-accent"}`}
          >
            Dashboard
          </Link>
          <Link
            href={ROUTES.CALENDAR}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${pathname === ROUTES.CALENDAR ? "text-primary bg-accent" : "text-foreground hover:text-primary hover:bg-accent"}`}
          >
            Calendar
          </Link>
          <Link
            href={ROUTES.STATS}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${pathname === ROUTES.STATS ? "text-primary bg-accent" : "text-foreground hover:text-primary hover:bg-accent"}`}
          >
            Statistics
          </Link>
          <Link
            href={ROUTES.FRIENDS}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${pathname === ROUTES.FRIENDS ? "text-primary bg-accent" : "text-foreground hover:text-primary hover:bg-accent"}`}
          >
            Friends
          </Link>
          <Link
            href={ROUTES.LEADERBOARD}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${pathname === ROUTES.LEADERBOARD ? "text-primary bg-accent" : "text-foreground hover:text-primary hover:bg-accent"}`}
          >
            Leaderboard
          </Link>

          <div className="ml-25 flex items-center gap-2">
            <ThemeToggle />
            <Link
              href={ROUTES.NOTIFICATIONS}
              className={`p-2 rounded-full transition-colors relative ${pathname === ROUTES.NOTIFICATIONS ? "bg-accent" : "hover:bg-accent"}`}
              aria-label="Notifications"
            >
              <BellIcon size={20} />
              {/* Badge unread count */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
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
            <span
              className={`w-5 h-0.5 bg-foreground transition-all ${isMenuOpen ? "rotate-45 translate-y-1" : ""}`}
            ></span>
            <span
              className={`w-5 h-0.5 bg-foreground transition-all my-1 ${isMenuOpen ? "opacity-0" : ""}`}
            ></span>
            <span
              className={`w-5 h-0.5 bg-foreground transition-all ${isMenuOpen ? "-rotate-45 -translate-y-1" : ""}`}
            ></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-background border-t border-border animate-slide-down">
          <nav className="flex flex-col items-stretch gap-1 p-4">
            <Link
              href={ROUTES.DASHBOARD}
              className={`px-4 py-3 text-sm font-medium rounded-lg transition-all text-center ${pathname === ROUTES.DASHBOARD ? "text-primary bg-accent" : "text-foreground hover:text-primary hover:bg-accent"}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href={ROUTES.TASKS}
              className={`px-4 py-3 text-sm font-medium rounded-lg transition-all text-center ${pathname === ROUTES.TASKS ? "text-primary bg-accent" : "text-foreground hover:text-primary hover:bg-accent"}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Tasks
            </Link>
            <Link
              href={ROUTES.CALENDAR}
              className={`px-4 py-3 text-sm font-medium rounded-lg transition-all text-center ${pathname === ROUTES.CALENDAR ? "text-primary bg-accent" : "text-foreground hover:text-primary hover:bg-accent"}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Calendar
            </Link>
            <Link
              href={ROUTES.STATS}
              className={`px-4 py-3 text-sm font-medium rounded-lg transition-all text-center ${pathname === ROUTES.STATS ? "text-primary bg-accent" : "text-foreground hover:text-primary hover:bg-accent"}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Statistics
            </Link>
            <Link
              href={ROUTES.FRIENDS}
              className={`px-4 py-3 text-sm font-medium rounded-lg transition-all text-center ${pathname === ROUTES.FRIENDS ? "text-primary bg-accent" : "text-foreground hover:text-primary hover:bg-accent"}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Friends
            </Link>
            <Link
              href={ROUTES.LEADERBOARD}
              className={`px-4 py-3 text-sm font-medium rounded-lg transition-all text-center ${pathname === ROUTES.LEADERBOARD ? "text-primary bg-accent" : "text-foreground hover:text-primary hover:bg-accent"}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Leaderboard
            </Link>
            <Link
              href={ROUTES.NOTIFICATIONS}
              className={`px-4 py-3 text-sm font-medium rounded-lg transition-all text-center ${pathname === ROUTES.NOTIFICATIONS ? "text-primary bg-accent" : "text-foreground hover:text-primary hover:bg-accent"}`}
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
