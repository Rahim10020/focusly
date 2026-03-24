// Landing page component for unauthenticated users.

"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { ROUTES } from "@/components/shared/constants/routes";

export function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      {/* Hero Section */}
      <main className="relative overflow-hidden min-h-screen flex items-center">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-brand-accent/5 dark:from-primary/10 dark:to-brand-accent/10 pointer-events-none" />

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
                onClick={() => router.push(ROUTES.SIGN_UP)}
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
                onClick={() => router.push(ROUTES.SIGN_IN)}
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
