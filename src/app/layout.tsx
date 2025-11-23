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
import "./globals.css";

export const metadata: Metadata = {
  title: "Focusly – Focus & Productivity",
  description: "A beautiful Pomodoro timer app with task management, achievements, and productivity tracking",
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
              {children}
            </ToastProvider>
          </ThemeProvider>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}