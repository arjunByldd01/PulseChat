"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function NewWorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to create workspace"); return; }
      router.push(`/workspace/${data.id}`);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="mb-10 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4a154b]">
          <span className="text-xl font-bold text-white">#</span>
        </div>
        <span className="text-2xl font-bold text-gray-900">slack</span>
      </div>

      <div className="w-full max-w-[480px] text-center">
        <h1 className="text-3xl font-bold text-gray-900">What&apos;s the name of your company or team?</h1>
        <p className="mt-3 text-base text-gray-500">
          This will be the name of your Slack workspace — choose something that your team will recognize.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-1.5 text-left">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
              Workspace name
            </Label>
            <Input
              id="name"
              placeholder="Ex: Acme or Acme Marketing"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-12 border-gray-300 text-base"
              autoFocus
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <Button
            type="submit"
            className="h-12 w-full bg-[#4a154b] text-base font-medium hover:bg-[#611f69]"
            disabled={loading || !name.trim()}
          >
            {loading ? "Creating…" : "Next"}
          </Button>
        </form>
      </div>
    </div>
  );
}
