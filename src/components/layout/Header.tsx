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

interface HeaderProps {
  mainContentId?: string;
}

const SWIPE_THRESHOLD = 50;

function Header({ mainContentId = "main-content" }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const wasMenuOpenRef = useRef(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number>(0);
  const touchEndXRef = useRef<number>(0);
  const historyPushedRef = useRef(false);

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

  const closeMenuAndRestoreHistory = useCallback(() => {
    closeMenu();
    if (historyPushedRef.current) {
      historyPushedRef.current = false;
      window.history.back();
    }
  }, [closeMenu]);

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
      if (event.key === "Escape") closeMenuAndRestoreHistory();
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
  }, [isMenuOpen, closeMenuAndRestoreHistory, closeMenu]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        closeMenuAndRestoreHistory();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen, closeMenuAndRestoreHistory]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const focusableElements = [
      ...drawerRef.current?.querySelectorAll<
        HTMLElement
      >(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) ?? [],
    ].filter((el) => {
      const isHidden = el.offsetParent === null;
      return !isHidden || el.tagName === "INPUT" || (el.tagName === "BUTTON" && (el as HTMLButtonElement).type !== "submit");
    });

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleTabKeyDown);
    return () => document.removeEventListener("keydown", handleTabKeyDown);
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleTouchStart = (event: TouchEvent) => {
      touchStartXRef.current = event.touches[0].clientX;
    };
    const handleTouchEnd = (event: TouchEvent) => {
      touchEndXRef.current = event.changedTouches[0].clientX;
      const deltaX = touchEndXRef.current - touchStartXRef.current;
      const absDeltaX = Math.abs(deltaX);

      if (absDeltaX > SWIPE_THRESHOLD) {
        closeMenuAndRestoreHistory();
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMenuOpen, closeMenuAndRestoreHistory]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePopState = () => {
      closeMenu();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isMenuOpen, closeMenu]);

  useEffect(() => {
    const mainContent = document.getElementById(mainContentId);
    if (mainContent) {
      if (isMenuOpen) {
        mainContent.setAttribute("aria-hidden", "true");
        mainContent.style.pointerEvents = "none";
      } else {
        mainContent.removeAttribute("aria-hidden");
        mainContent.style.pointerEvents = "";
      }
    }

    return () => {
      if (mainContent) {
        mainContent.removeAttribute("aria-hidden");
        mainContent.style.pointerEvents = "";
      }
    };
  }, [isMenuOpen, mainContentId]);

  const openMenu = useCallback(() => {
    if (!historyPushedRef.current) {
      window.history.pushState({ menuOpen: true }, "");
      historyPushedRef.current = true;
    }
    setIsMenuOpen(true);
  }, []);

  const handleMenuButtonClick = useCallback(() => {
    if (isMenuOpen) {
      closeMenuAndRestoreHistory();
    } else {
      openMenu();
    }
  }, [isMenuOpen, closeMenuAndRestoreHistory, openMenu]);

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
            onClick={handleMenuButtonClick}
            className="flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-accent transition-all focus-ring cursor-pointer"
            aria-label={isMenuOpen ? "Close menu" : "Toggle menu"}
            aria-controls="mobile-navigation-drawer"
            aria-expanded={isMenuOpen}
          >
            <span
              className={`w-5 h-0.5 bg-foreground transition-all ${isMenuOpen ? "rotate-45 translate-y-1" : ""}`}
            ></span>
            <span
              className={`w-5 h-0.5 bg-foreground transition-all my-1 ${isMenuOpen ? "opacity-1" : ""}`}
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
            ref={drawerRef}
            id="mobile-navigation-drawer"
            className="fixed inset-x-0 top-14 bottom-0 z-40 bg-primary overflow-y-auto animate-mobile-drawer-down md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            <nav
              className="flex min-h-full flex-col justify-center items-stretch gap-4 p-4"
              aria-label="Mobile navigation"
            >
              <Link
                href={ROUTES.DASHBOARD}
                className={`px-4 py-3 text-2xl font-normal transition-all text-center ${pathname === ROUTES.DASHBOARD ? "text-white font-medium underline" : "text-white"}`}
                onClick={closeMenuAndRestoreHistory}
              >
                Dashboard
              </Link>
              <Link
                href={ROUTES.TASKS}
                className={`px-4 py-3 text-2xl font-normal transition-all text-center ${pathname === ROUTES.TASKS ? "text-white font-medium underline" : "text-white"}`}
                onClick={closeMenuAndRestoreHistory}
              >
                Tasks
              </Link>
              <Link
                href={ROUTES.CALENDAR}
                className={`px-4 py-3 text-2xl font-normal transition-all text-center ${pathname === ROUTES.CALENDAR ? "text-white font-medium underline" : "text-white"}`}
                onClick={closeMenuAndRestoreHistory}
              >
                Calendar
              </Link>
              <Link
                href={ROUTES.STATS}
                className={`px-4 py-3 text-2xl font-normal transition-all text-center ${pathname === ROUTES.STATS ? "text-white font-medium underline" : "text-white"}`}
                onClick={closeMenuAndRestoreHistory}
              >
                Statistics
              </Link>
              <Link
                href={ROUTES.FRIENDS}
                className={`px-4 py-3 text-2xl font-normal transition-all text-center ${pathname === ROUTES.FRIENDS ? "text-white font-medium underline" : "text-white"}`}
                onClick={closeMenuAndRestoreHistory}
              >
                Friends
              </Link>
              <Link
                href={ROUTES.LEADERBOARD}
                className={`px-4 py-3 text-2xl font-normal transition-all text-center ${pathname === ROUTES.LEADERBOARD ? "text-white font-medium underline" : "text-white"}`}
                onClick={closeMenuAndRestoreHistory}
              >
                Leaderboard
              </Link>
              <Link
                href={ROUTES.NOTIFICATIONS}
                className={`px-4 py-3 text-2xl font-normal transition-all text-center ${pathname === ROUTES.NOTIFICATIONS ? "text-white font-medium underline" : "text-white"}`}
                onClick={closeMenuAndRestoreHistory}
              >
                Notifications
              </Link>
              {/* Auth links — decomposed from UserMenu */}
              {session?.user ? (
                <>
                  <Link
                    href={ROUTES.PROFILE}
                    className={`px-4 py-3 text-2xl font-normal transition-all text-center ${pathname === ROUTES.PROFILE ? "text-white font-medium underline" : "text-white"}`}
                    onClick={closeMenuAndRestoreHistory}
                  >
                    Profile
                  </Link>
                  <Link
                    href={ROUTES.SETTINGS}
                    className={`px-4 py-3 text-2xl font-normal transition-all text-center ${pathname === ROUTES.SETTINGS ? "text-white font-medium underline" : "text-white"}`}
                    onClick={closeMenuAndRestoreHistory}
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    className="px-4 py-3 mt-8 text-2xl font-bold transition-all text-center text-white"
                    onClick={async () => {
                      closeMenuAndRestoreHistory();
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
                  className={`px-4 py-3 text-2xl font-bold transition-all text-center ${pathname === ROUTES.SIGN_IN ? "text-white" : "text-white"}`}
                  onClick={closeMenuAndRestoreHistory}
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

const MemoizedHeader = ({ mainContentId }: HeaderProps) => {
  return <Header mainContentId={mainContentId} />;
};

export default MemoizedHeader;
