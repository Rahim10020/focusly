"use client";

import { useSession } from "next-auth/react";
import { LandingPage } from "@/components/home/LandingPage";
import { Dashboard } from "@/components/home/Dashboard";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LandingPage />;
  }

  return <Dashboard session={session} />;
}
