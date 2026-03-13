// Landing page component for unauthenticated users.

"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { FloatingFeatureCard } from "./FloatingFeatureCard";

export function LandingPage() {
  const router = useRouter();

  const featureCards = [
    {
      title: "Pomodoro Timer",
      description:
        "Stay focused with customizable 25-minute work sessions followed by refreshing breaks.",
      icon: (
        <svg
          className="w-6 h-6 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      className: "-left-10 top-10",
      animationDelay: "0s",
    },
    {
      title: "Smart Task Management",
      description:
        "Organize tasks by priority, add sub-tasks, and track your progress with detailed insights.",
      icon: (
        <svg
          className="w-6 h-6 text-brand-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
      className: "-right-12 top-12",
      animationDelay: "0.2s",
    },
    {
      title: "Achievements & Stats",
      description:
        "Build streaks, unlock achievements, and compete with friends on the leaderboard.",
      icon: (
        <svg
          className="w-6 h-6 text-brand-accent"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      ),
      className: "-right-6 bottom-12",
      animationDelay: "0.4s",
    },
    {
      title: "Calendar Planning",
      description:
        "Plot tasks on a monthly calendar, see start times, and export your schedule to iCal.",
      icon: (
        <svg
          className="w-6 h-6 text-brand-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      className: "-left-12 bottom-10",
      animationDelay: "0.3s",
    },
    {
      title: "Analytics & Export",
      description:
        "Unlock charts, streak insights, and one-click CSV/PDF exports from the dashboard.",
      icon: (
        <svg
          className="w-6 h-6 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3v18h18M7 14l3 3 7-10"
          />
        </svg>
      ),
      className: "left-1/2 -translate-x-1/2 -top-6",
      animationDelay: "0.1s",
    },
    {
      title: "Friends & Leaderboard",
      description:
        "Add friends, accept requests, and climb global rankings for tasks, focus time, or streaks.",
      icon: (
        <svg
          className="w-6 h-6 text-brand-accent"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a4 4 0 00-3-3.87M9 12a4 4 0 10-4-4 4 4 0 004 4zm0 0c-3.314 0-6 2.239-6 5v1h6m5-9a4 4 0 114-4 4 4 0 01-4 4zm0 0c-1.48 0-2.805.804-3.5 2"
          />
        </svg>
      ),
      className: "-right-44 top-1/2 -translate-y-1/2",
      animationDelay: "0.15s",
    },
    {
      title: "Smart Notifications",
      description:
        "Get alerted for overdue tasks, due-today reminders, and completed Pomodoros in real-time.",
      icon: (
        <svg
          className="w-6 h-6 text-brand-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 00-3 0v.68C7.64 5.36 6 7.92 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1"
          />
        </svg>
      ),
      className: "-left-44 top-1/2 -translate-y-1/2",
      animationDelay: "0.25s",
    },
  ];

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      {/* Hero Section */}
      <main className="relative overflow-hidden min-h-screen flex items-center">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-brand-accent/5 dark:from-primary/10 dark:to-brand-accent/10 pointer-events-none" />

        {/* Floating Feature Cards - Background */}
        <div className="absolute inset-0 max-w-[1200px] mx-auto px-6 pointer-events-none hidden lg:block">
          <div className="relative h-full">
            {featureCards.map((card, index) => (
              <FloatingFeatureCard
                key={index}
                title={card.title}
                description={card.description}
                icon={card.icon}
                className={card.className}
                animationDelay={card.animationDelay}
              />
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 relative z-10">
          {/* Hero Content */}
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight animate-slide-up">
              Master Your Focus,
              <br />
              <span className="bg-linear-to-r from-primary via-brand-secondary to-brand-accent bg-clip-text text-transparent">
                Achieve Your Goals
              </span>
            </h1>

            <p
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up"
              style={{ animationDelay: "0.1s" }}
            >
              Focusly combines the power of the Pomodoro Technique with smart
              task management to help you stay productive and build lasting
              habits.
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row gap-3 justify-center items-center animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              <Button
                onClick={() => router.push("/auth/signup")}
                size="lg"
                className="min-w-[180px]"
              >
                <svg
                  className="w-5 h-5 animate-arrow-slide"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
                Get Started Free
              </Button>
              <Button
                onClick={() => router.push("/auth/signin")}
                variant="outline"
                size="lg"
                className="min-w-[180px]"
              >
                Sign In
              </Button>
            </div>

            {/* Social Proof */}
            <div
              className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-4 animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-brand-accent"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span className="font-medium">Join productive teams</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-brand-accent"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">Free forever</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
