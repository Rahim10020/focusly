"use client";

import * as Sentry from "@sentry/nextjs";

if (typeof window !== "undefined") {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

export function SentryProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
