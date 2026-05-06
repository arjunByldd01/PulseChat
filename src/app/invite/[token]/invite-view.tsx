"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

interface Props {
  token: string;
  workspaceId: string;
  workspaceName: string;
  isAuthenticated: boolean;
}

export function InviteView({
  token,
  workspaceId,
  workspaceName,
  isAuthenticated,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteToken: token }),
      });
      if (res.ok || res.status === 409) {
        router.push(`/workspace/${workspaceId}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, inviteToken: token }),
      });
      const data = (await res.json()) as { error?: string; workspaceId?: string };
      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        return;
      }
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        router.push("/sign-in");
        return;
      }
      router.push(`/workspace/${data.workspaceId ?? workspaceId}`);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold">Join {workspaceName}</h1>
        {isAuthenticated ? (
          <p className="text-sm text-muted-foreground">
            You&apos;re invited to join this workspace.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Create an account to join.
          </p>
        )}
      </div>

      {isAuthenticated ? (
        <Button className="w-full" onClick={handleJoin} disabled={loading}>
          {loading ? "Joining…" : `Join ${workspaceName}`}
        </Button>
      ) : (
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="At least 8 characters"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account & join"}
          </Button>
        </form>
      )}
    </div>
  );
}
