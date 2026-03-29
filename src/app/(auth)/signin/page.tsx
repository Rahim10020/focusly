/**
 * @fileoverview Sign In page for the Focusly application.
 * Provides email/password authentication form with error handling
 * and navigation to sign up page.
 * @module app/signin/page
 */

"use client";

import { useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ROUTES } from "@/constants";
import { MyLoader } from "@/components/shared/MyLoader";
import { ArrowRightLgIcon } from "@/components/shared/icons";

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
      const { error: signInError } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        // Check if error is due to unconfirmed email
        if (signInError.message.includes("Email not confirmed")) {
          setError("Please verify your email address before signing in.");
        } else if (signInError.message.includes("Invalid login credentials")) {
          setError("Incorrect email or password");
        } else {
          setError(signInError.message || "An error occurred");
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
    <Card variant="none">
      <CardHeader className="mb-8">
        <CardTitle className="text-start text-foreground">Sign In</CardTitle>
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
              className="placeholder:text-sm placeholder:text-black-40"
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
              showPasswordToggle
              className="placeholder:text-sm placeholder:text-black-40"
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <MyLoader label="Signing in" /> : "Sign In"}
            <ArrowRightLgIcon className="w-5 h-5 animate-arrow-slide" />
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
  );
}
