"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

function SignUpForm() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("inviteToken");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, inviteToken }),
      });
      const data = (await res.json()) as { error?: string; workspaceId?: string };
      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        return;
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        window.location.href = "/sign-in";
        return;
      }
      window.location.href = data.workspaceId ? `/workspace/${data.workspaceId}` : "/";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[400px] rounded-lg border border-gray-200 bg-white px-10 py-10 shadow-sm">
      <h1 className="mb-1 text-center text-3xl font-bold text-gray-900">
        Create your account
      </h1>
      <p className="mb-8 text-center text-sm text-gray-500">
        We suggest using the{" "}
        <span className="font-medium text-gray-700">email address you use at work.</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
            Full name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Jane Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="h-11 border-gray-300 text-sm"
          />
        </div>

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
            className="h-11 border-gray-300 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
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
          disabled={loading || !email || !password}
        >
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-[#1264a3] hover:underline">
          Sign in
        </Link>
      </p>

      <p className="mt-4 text-center text-xs text-gray-400">
        By continuing, you&apos;re agreeing to our{" "}
        <span className="text-[#1264a3]">Terms of Service</span> and{" "}
        <span className="text-[#1264a3]">Privacy Policy</span>.
      </p>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4a154b]">
          <span className="text-xl font-bold text-white">#</span>
        </div>
        <span className="text-2xl font-bold text-gray-900">slack</span>
      </div>
      <Suspense fallback={<div className="h-10 w-[400px] animate-pulse rounded-lg bg-gray-100" />}>
        <SignUpForm />
      </Suspense>
    </div>
  );
}
