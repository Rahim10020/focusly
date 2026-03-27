/**
 * @fileoverview Sign Up page for the Focusly application.
 * Provides user registration form with email verification flow
 * using Supabase authentication.
 * @module app/signup/page
 */

"use client";

import { useState, useEffect } from "react";
import { supabaseClient as supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ROUTES } from "@/components/shared/constants/routes";
import { MyLoader } from "@/components/ui/MyLoader";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user?.email_confirmed_at) {
        // L'email a été vérifié, rediriger vers signin
        router.push(ROUTES.SIGN_IN);
      }
    });

    // Nettoyer l'écouteur au démontage du composant
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
          data: {
            username: username,
          },
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setSuccessMessage(
          "A verification email has been sent to your email address.",
        );
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // if (success) {
  return (
    <Card variant="none">
      <CardHeader className="mb-8">
        <CardTitle className="text-start text-foreground">
          Registration Successful!
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-black-60 text-base">
          {successMessage ||
            "A verification email has been sent to your email address."}
        </p>
        <p className="text-base text-black-60 mb-12">
          Check your inbox and click the link to activate your account.
        </p>
        <div className="mt-4">
          <p className="text-sm text-black-50">
            Didn&apos;t receive the email?{" "}
            <button
              onClick={async () => {
                try {
                  setLoading(true);
                  const baseUrl = window.location.origin;
                  const emailRedirectTo = new URL(
                    ROUTES.VERIFY_EMAIL,
                    baseUrl,
                  ).toString();
                  const { error } = await supabase.auth.resend({
                    type: "signup",
                    email,
                    options: {
                      emailRedirectTo,
                    },
                  });
                  if (error) throw error;
                  setSuccessMessage("A new verification email has been sent!");
                } catch {
                  setError("Error sending email. Please try again.");
                } finally {
                  setLoading(false);
                }
              }}
              className="text-primary cursor-pointer hover:underline focus:outline-none"
              disabled={loading}
            >
              {loading ? <MyLoader label="Verifying email" /> : "Resend Email"}
            </button>
          </p>
        </div>
        <div className="mt-6">
          <Button
            variant="primary"
            onClick={() => router.push(ROUTES.SIGN_IN)}
            className=""
          >
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
            Back to Sign In
          </Button>
        </div>
      </CardContent>
    </Card>
  );
  // }

  // return (
  //   <Card variant="none">
  //     <CardHeader className="mb-8">
  //       <CardTitle className="text-start text-foreground">
  //         Create Account
  //       </CardTitle>
  //     </CardHeader>
  //     <CardContent>
  //       <form onSubmit={handleSubmit} className="space-y-4">
  //         <div>
  //           <label
  //             htmlFor="username"
  //             className="block text-sm font-normal mb-1 text-black-40"
  //           >
  //             Username
  //           </label>
  //           <Input
  //             id="username"
  //             type="text"
  //             value={username}
  //             onChange={(e) => setUsername(e.target.value)}
  //             required
  //             placeholder="Your username"
  //             className="placeholder:text-sm placeholder:text-black-40"
  //           />
  //         </div>
  //         <div>
  //           <label
  //             htmlFor="email"
  //             className="block text-sm font-normal mb-1 text-black-40"
  //           >
  //             Email
  //           </label>
  //           <Input
  //             id="email"
  //             type="email"
  //             value={email}
  //             onChange={(e) => setEmail(e.target.value)}
  //             required
  //             placeholder="your@email.com"
  //             className="placeholder:text-sm placeholder:text-black-40"
  //           />
  //         </div>
  //         <div>
  //           <label
  //             htmlFor="password"
  //             className="block text-sm font-normal mb-1 text-black-40"
  //           >
  //             Password
  //           </label>
  //           <Input
  //             id="password"
  //             type="password"
  //             value={password}
  //             onChange={(e) => setPassword(e.target.value)}
  //             required
  //             minLength={6}
  //             placeholder="Your password"
  //             showPasswordToggle
  //             className="placeholder:text-sm placeholder:text-black-40"
  //           />
  //         </div>
  //         {error && (
  //           <div className="text-red-500 text-sm text-center">{error}</div>
  //         )}
  //         <Button type="submit" className="w-full" disabled={loading}>
  //           {loading ? (
  //             <MyLoader label="Creating account" />
  //           ) : (
  //             "Create My Account"
  //           )}
  //           <svg
  //             className="w-5 h-5 animate-arrow-slide"
  //             fill="none"
  //             stroke="currentColor"
  //             viewBox="0 0 24 24"
  //           >
  //             <path
  //               strokeLinecap="round"
  //               strokeLinejoin="round"
  //               strokeWidth={2}
  //               d="M13 7l5 5m0 0l-5 5m5-5H6"
  //             />
  //           </svg>
  //         </Button>
  //       </form>
  //       <div className="mt-4 text-center">
  //         <p className="text-sm text-black-40">
  //           Already have an account?{" "}
  //           <Link
  //             href={ROUTES.SIGN_IN}
  //             className="text-primary hover:underline"
  //           >
  //             Sign In
  //           </Link>
  //         </p>
  //       </div>
  //     </CardContent>
  //   </Card>
  // );
}
