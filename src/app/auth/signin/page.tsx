/**
 * @fileoverview Sign In page for the Focusly application.
 * Provides email/password authentication form with error handling
 * and navigation to sign up page.
 * @module app/auth/signin/page
 */

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ROUTES } from "@/components/shared/constants/routes";
import { MyLoader } from "@/components/ui/MyLoader";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Check if error is due to unconfirmed email
        if (result.error.includes("Email not confirmed")) {
          setError("Please verify your email address before signing in.");
        } else if (result.error === "CredentialsSignin") {
          setError("Incorrect email or password");
        } else {
          setError(result.error);
        }
      } else {
        router.push(ROUTES.HOME);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setError("An error occurred during sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-2 transition-colors duration-200">
      <div className="flex items-center bg-white justify-center">
        <Card variant="none">
          <CardHeader>
            <CardTitle className="text-start text-foreground">
              Sign In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-normal mb-1 text-black-40"
                >
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-normal mb-1 text-black-40"
                >
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Your password"
                />
              </div>
              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <MyLoader label="Signing in" /> : "Sign In"}
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
              </Button>
            </form>
            <div className="mt-4 text-center">
              <p className="text-sm text-black-40">
                Don&apos;t have an account?{" "}
                <Link
                  href={ROUTES.SIGN_UP}
                  className="text-primary hover:underline"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="bg-primary"></div>
    </div>
  );
}
