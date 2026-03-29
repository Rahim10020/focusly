"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ROUTES } from "@/lib/constants";

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  const initial = useMemo(() => {
    const name = session?.user?.name || session?.user?.email || "U";
    return name.charAt(0).toUpperCase();
  }, [session?.user?.name, session?.user?.email]);

  if (status === "loading") {
    return (
      <div
        className="w-9 h-9 rounded-full bg-muted animate-pulse"
        aria-hidden="true"
      />
    );
  }

  if (!session?.user) {
    return (
      <Link
        href={ROUTES.SIGN_IN}
        className="px-3 py-2 text-sm font-medium rounded-lg text-foreground hover:text-primary hover:bg-accent transition-all"
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-9 h-9 rounded-full bg-primary/15 text-primary font-semibold flex items-center justify-center hover:bg-primary/25 transition-colors cursor-pointer"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open user menu"
      >
        {initial}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-card shadow-lg p-2 z-50"
          role="menu"
        >
          <Link
            href={ROUTES.PROFILE}
            className="block w-full px-3 py-2 rounded-lg text-sm hover:bg-accent"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <Link
            href={ROUTES.SETTINGS}
            className="block w-full px-3 py-2 rounded-lg text-sm hover:bg-accent"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <button
            type="button"
            className="block w-full text-left px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-accent cursor-pointer"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await signOut({ callbackUrl: ROUTES.SIGN_IN });
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
