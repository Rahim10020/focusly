"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useAuth";
import { MyLoader } from "@/components/shared/MyLoader";
import { ROUTES } from "@/constants";
import { LandingPage } from "@/app/(public)/_components/LandingPage";

export function HomeDispatcher() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.replace(ROUTES.HOME_PAGE);
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <MyLoader label="Loading" />
      </div>
    );
  }

  if (session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <MyLoader label="Redirecting" />
      </div>
    );
  }

  return <LandingPage />;
}
