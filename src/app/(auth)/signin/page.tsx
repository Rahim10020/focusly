"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/Card";
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
      const supabaseClient = getSupabaseClient();
      const { error: signInError } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
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
      <CardHeader className="mb-12">
        <CardTitle className="text-start text-foreground">Sign In</CardTitle>
        <CardDescription className="mt-2 text-start">
          Welcome back — let&apos;s get you back to focus.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-md font-normal mb-2 text-text-subtle"
            >
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              noBorder={true}
              placeholder="your@email.com"
              className="placeholder:text-sm placeholder:text-text-subtle"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-md font-normal mb-2 text-text-subtle"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              noBorder={true}
              placeholder="your password"
              showPasswordToggle
              className="placeholder:text-sm placeholder:text-text-subtle"
            />
          </div>
          {error && (
            <div className="text-error text-sm text-center">{error}</div>
          )}
          <div className="mt-12">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <MyLoader label="Signing in" /> : "Sign In"}
              <ArrowRightLgIcon className="w-5 h-5 animate-arrow-slide" />
            </Button>
            <div className="mt-4 text-center">
              <p className="text-sm text-text-subtle">
                Don&apos;t have an account?{" "}
                <Link
                  href={ROUTES.SIGN_UP}
                  className="text-primary hover:underline"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
