/**
 * @fileoverview Shared layout for user profile routes.
 * Provides persistent Header and main container structure for user pages.
 */

import Header from "@/components/layout/Header";

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
