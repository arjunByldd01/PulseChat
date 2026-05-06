"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        return;
      }
      window.location.href = callbackUrl;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[400px] rounded-lg border border-gray-200 bg-white px-10 py-10 shadow-sm">
      <h1 className="mb-1 text-center text-3xl font-bold text-gray-900">
        Sign in to Slack
      </h1>
      <p className="mb-8 text-center text-base text-gray-500">
        We suggest using the{" "}
        <span className="font-medium text-gray-700">email address you use at work.</span>
      </p>

      {/* GitHub OAuth */}
      <Button
        variant="outline"
        className="mb-3 flex w-full items-center justify-center gap-2 border-gray-300 py-5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        onClick={() => signIn("github", { callbackUrl })}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
        </svg>
        Sign in with GitHub
      </Button>

      <div className="relative mb-6 mt-5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-gray-400 uppercase tracking-wide">OR</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="name@work-email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-11 border-gray-300 text-sm focus:border-[#4a154b] focus:ring-[#4a154b]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="h-11 border-gray-300 text-sm"
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="h-11 w-full bg-[#4a154b] text-sm font-medium hover:bg-[#611f69]"
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign in with email"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        New to Slack?{" "}
        <Link href="/sign-up" className="font-medium text-[#1264a3] hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4a154b]">
          <span className="text-xl font-bold text-white">#</span>
        </div>
        <span className="text-2xl font-bold text-gray-900">slack</span>
      </div>
      <Suspense fallback={<div className="h-10 w-[400px] animate-pulse rounded-lg bg-gray-100" />}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
