"use client";

import { useSession } from "next-auth/react";
import { LandingPage } from "@/components/home/LandingPage";
import { Dashboard } from "@/components/home/Dashboard";
import { LoadingIcon } from "@/components/icons";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <p className="text-base font-medium">Loading</p>
          <LoadingIcon
            className="mx-auto loading-icon-swing"
            size={32}
            color="var(--color-primary)"
          />
        </div>
      </div>
    );
  }

  if (!session) {
    return <LandingPage />;
  }

  return <Dashboard session={session} />;
}
