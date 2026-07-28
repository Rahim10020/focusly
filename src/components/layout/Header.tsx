"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import UserMenu from "../shared/UserMenu";
import { useNotificationsContext } from "@/components/providers/NotificationsProvider";
import { ROUTES } from "@/constants";
import AppLogo from "../shared/AppLogo";
import { BellIcon } from "@/components/shared/icons";
import { useSession, signOut } from "@/hooks/useAuth";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const wasMenuOpenRef = useRef(false);
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const router = useRouter();
  const { data: session } = useSession();
  const { unreadCount } = useNotificationsContext();

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;

    previousPathnameRef.current = pathname;
    const animationFrame = window.requestAnimationFrame(closeMenu);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (!isMenuOpen) {
      if (wasMenuOpenRef.current) {
        wasMenuOpenRef.current = false;
        menuButtonRef.current?.focus();
      }
      return;
    }

    wasMenuOpenRef.current = true;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    const handleResize = () => {
      if (window.innerWidth >= 768) closeMenu();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMenuOpen, closeMenu]);

  return (
    <header className="w-full bg-background/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <AppLogo iconSize={32} md={true} />
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <Link
            href={ROUTES.TASKS}
            className={`px-3 py-2 text-sm font-medium rounded-full transition-all ${pathname === ROUTES.TASKS ? "text-primary bg-accent" : "text-foreground hover:text-primary hover:bg-accent"}`}
          >
            Tasks
          </Link>
          <Link
            href={ROUTES.DASHBOARD}
            className={`px-3 py-2 text-sm font-medium rounded-full transition-all ${pathname === ROUTES.DASHBOARD ? "text-primary bg-accent" : "text-foreground hover:text-primary hover:bg-accent"}`}
          >
            Dashboard
          </Link>
          <Link
            href={ROUTES.CALENDAR}
            className={`px-3 py-2 text-sm font-medium rounded-full transition-all ${pathname === ROUTES.CALENDAR ? "text-primary bg-accent" : "text-foreground hover:text-primary hover:bg-accent"}`}
          >
            Calendar
          </Link>
          <Link
            href={ROUTES.STATS}
            className={`px-3 py-2 text-sm font-medium rounded-full transition-all ${pathname === ROUTES.STATS ? "text-primary bg-accent" : "text-foreground hover:text-primary hover:bg-accent"}`}
          >
            Statistics
          </Link>
          <Link
            href={ROUTES.FRIENDS}
            className={`px-3 py-2 text-sm font-medium rounded-full transition-all ${pathname === ROUTES.FRIENDS ? "text-primary bg-accent" : "text-foreground hover:text-primary hover:bg-accent"}`}
          >
            Friends
          </Link>
          <Link
            href={ROUTES.LEADERBOARD}
            className={`px-3 py-2 text-sm font-medium rounded-full transition-all ${pathname === ROUTES.LEADERBOARD ? "text-primary bg-accent" : "text-foreground hover:text-primary hover:bg-accent"}`}
          >
            Leaderboard
          </Link>

          <div className="ml-25 flex items-center gap-2">
            <Link
              href={ROUTES.NOTIFICATIONS}
              className={`p-2 rounded-full transition-colors relative ${pathname === ROUTES.NOTIFICATIONS ? "bg-accent" : "hover:bg-accent"}`}
              aria-label="Notifications"
            >
              <BellIcon size={20} />
              {/* Badge unread count */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <UserMenu />
          </div>
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-3">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
            className="flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-accent transition-all focus-ring cursor-pointer"
            aria-label="Toggle menu"
            aria-controls="mobile-navigation-drawer"
            aria-expanded={isMenuOpen}
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
      {isMenuOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            id="mobile-navigation-drawer"
            className="fixed inset-x-0 top-14 bottom-0 z-40 bg-black overflow-y-auto animate-mobile-drawer-down md:hidden"
          >
            <nav
              className="flex min-h-full flex-col justify-center items-stretch gap-4 p-4"
              aria-label="Mobile navigation"
            >
              <Link
                href={ROUTES.DASHBOARD}
                className={`px-4 py-3 text-lg font-normal transition-all text-center ${pathname === ROUTES.DASHBOARD ? "text-primary font-medium" : "text-white"}`}
                onClick={closeMenu}
              >
                Dashboard
              </Link>
              <Link
                href={ROUTES.TASKS}
                className={`px-4 py-3 text-lg font-normal transition-all text-center ${pathname === ROUTES.TASKS ? "text-primary font-medium" : "text-white"}`}
                onClick={closeMenu}
              >
                Tasks
              </Link>
              <Link
                href={ROUTES.CALENDAR}
                className={`px-4 py-3 text-lg font-normal transition-all text-center ${pathname === ROUTES.CALENDAR ? "text-primary font-medium" : "text-white"}`}
                onClick={closeMenu}
              >
                Calendar
              </Link>
              <Link
                href={ROUTES.STATS}
                className={`px-4 py-3 text-lg font-normal transition-all text-center ${pathname === ROUTES.STATS ? "text-primary font-medium" : "text-white"}`}
                onClick={closeMenu}
              >
                Statistics
              </Link>
              <Link
                href={ROUTES.FRIENDS}
                className={`px-4 py-3 text-lg font-normal transition-all text-center ${pathname === ROUTES.FRIENDS ? "text-primary font-medium" : "text-white"}`}
                onClick={closeMenu}
              >
                Friends
              </Link>
              <Link
                href={ROUTES.LEADERBOARD}
                className={`px-4 py-3 text-lg font-normal transition-all text-center ${pathname === ROUTES.LEADERBOARD ? "text-primary font-medium" : "text-white"}`}
                onClick={closeMenu}
              >
                Leaderboard
              </Link>
              <Link
                href={ROUTES.NOTIFICATIONS}
                className={`px-4 py-3 text-lg font-normal transition-all text-center ${pathname === ROUTES.NOTIFICATIONS ? "text-primary font-medium" : "text-white"}`}
                onClick={closeMenu}
              >
                Notifications
              </Link>
              {/* Auth links — decomposed from UserMenu */}
              {session?.user ? (
                <>
                  <Link
                    href={ROUTES.PROFILE}
                    className={`px-4 py-3 text-lg font-normal transition-all text-center ${pathname === ROUTES.PROFILE ? "text-primary font-medium" : "text-white"}`}
                    onClick={closeMenu}
                  >
                    Profile
                  </Link>
                  <Link
                    href={ROUTES.SETTINGS}
                    className={`px-4 py-3 text-lg font-normal transition-all text-center ${pathname === ROUTES.SETTINGS ? "text-primary font-medium" : "text-white"}`}
                    onClick={closeMenu}
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    className="px-4 py-3 text-lg font-normal transition-all text-center text-primary"
                    onClick={async () => {
                      closeMenu();
                      await signOut();
                      router.push(ROUTES.SIGN_IN);
                    }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href={ROUTES.SIGN_IN}
                  className={`px-4 py-3 text-lg font-normal transition-all text-center ${pathname === ROUTES.SIGN_IN ? "text-primary font-medium" : "text-primary"}`}
                  onClick={closeMenu}
                >
                  Sign In
                </Link>
              )}
            </nav>
          </div>,
          document.body,
        )}
    </header>
  );
}
