/**
 * @fileoverview Shared layout for authenticated app routes.
 * Provides persistent Header and main container structure for all menu pages.
 */

import Header from "@/components/layout/Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
