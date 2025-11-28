/**
 * @fileoverview Root layout component for the Focusly application.
 * Sets up global providers (session, theme, toast), fonts, and metadata.
 * This layout wraps all pages and provides the core application structure.
 * @module app/layout
 */

import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import KeyboardShortcutsProvider from "@/components/providers/KeyboardShortcutsProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Focusly – Focus & Productivity",
    template: "%s | Focusly"
  },
  description: "A beautiful Pomodoro timer app with task management, achievements, and productivity tracking. Stay focused, build habits, and achieve your goals.",
  keywords: ["pomodoro", "productivity", "task management", "focus timer", "time management", "habits"],
  authors: [{ name: "Focusly Team" }],
  creator: "Focusly",
  publisher: "Focusly",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Focusly",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://focusly.app",
    title: "Focusly – Focus & Productivity",
    description: "Stay focused, build habits, and achieve your goals with our beautiful Pomodoro timer and task management app.",
    siteName: "Focusly",
  },
  twitter: {
    card: "summary_large_image",
    title: "Focusly – Focus & Productivity",
    description: "Stay focused, build habits, and achieve your goals",
    creator: "@focusly"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

/**
 * Root layout component that wraps all pages in the application.
 * Provides session management, theming, toast notifications, and analytics.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render within the layout
 * @returns {JSX.Element} The root HTML structure with all providers
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Focusly" />
      </head>
      <body className="antialiased font-sans">
        <SessionProvider>
          <ThemeProvider>
            <ToastProvider>
              <KeyboardShortcutsProvider>
                {children}
              </KeyboardShortcutsProvider>
            </ToastProvider>
          </ThemeProvider>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}