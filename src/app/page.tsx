"use client";

import { useSession } from "next-auth/react";
import { LandingPage } from "@/components/home/LandingPage";
import { Dashboard } from "@/components/home/Dashboard";
import { Loader } from "@/components/ui/Loader";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader label="Loading" />
      </div>
    );
  }

  if (!session) {
    return <LandingPage />;
  }

  return <Dashboard session={session} />;
}
