import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import KeyboardShortcutsProvider from "@/components/providers/KeyboardShortcutsProvider";
import "./globals.css";
import { NotificationsProvider } from "@/components/providers/NotificationsProvider";
import { STORAGE_KEYS } from "@/constants";

export const metadata: Metadata = {
  title: {
    default: "Focusly – Focus & Productivity",
    template: "%s | Focusly",
  },
  description:
    "A beautiful Pomodoro timer app with task management, achievements, and productivity tracking. Stay focused, build habits, and achieve your goals.",
  keywords: [
    "pomodoro",
    "productivity",
    "task management",
    "focus timer",
    "time management",
    "habits",
  ],
  authors: [{ name: "Twocoderz Team" }],
  creator: "Rahim ALI",
  publisher: "Rahim ALI",
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
    url: "https://focusly-work.vercel.app/",
    title: "Focusly – Focus & Productivity",
    description:
      "Stay focused, build habits, and achieve your goals with our beautiful Pomodoro timer and task management app.",
    siteName: "Focusly",
  },
  twitter: {
    card: "summary_large_image",
    title: "Focusly – Focus & Productivity",
    description: "Stay focused, build habits, and achieve your goals",
    creator: "@focusly",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Focusly – Focus & Productivity</title>
        {/* Inline script to apply saved theme before React hydration to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
  var t = localStorage.getItem('${STORAGE_KEYS.THEME}');
  if (t === 'dark' || (!t && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
} catch (e) {}`,
          }}
        />

        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Focusly" />
      </head>
      <body className="antialiased font-sans">
        <ThemeProvider>
          <ToastProvider>
            <KeyboardShortcutsProvider>
              <NotificationsProvider>{children}</NotificationsProvider>
            </KeyboardShortcutsProvider>
          </ToastProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
