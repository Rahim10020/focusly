import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { NotificationsProvider } from "@/components/providers/NotificationsProvider";
import { SentryProvider } from "@/components/providers/SentryProvider";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <head>
        <title>Focusly – Focus & Productivity</title>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Focusly" />
      </head>
      <body className="antialiased font-sans">
        <SentryProvider>
          <ToastProvider>
            <NotificationsProvider>{children}</NotificationsProvider>
          </ToastProvider>
        </SentryProvider>
        <Analytics />
      </body>
    </html>
  );
}
