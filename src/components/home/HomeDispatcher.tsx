"use client";

import { useSession } from "next-auth/react";
import { LandingPage } from "@/components/home/LandingPage";
import { Dashboard } from "@/components/home/Dashboard";
import { MyLoader } from "@/components/shared/MyLoader";

export function HomeDispatcher() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <MyLoader label="Loading" />
      </div>
    );
  }

  if (!session) {
    return <LandingPage />;
  }

  return <Dashboard session={session} />;
}
