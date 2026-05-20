"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@origin/ui/components/button";
import { Input } from "@origin/ui/components/input";
import { api, setSession } from "@/lib/api";
import { useToast } from "@/lib/toast";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const response =
        mode === "login"
          ? await api.login({
              email: String(form.get("email")),
              password: String(form.get("password"))
            })
          : await api.register({
              email: String(form.get("email")),
              username: String(form.get("username")),
              full_name: String(form.get("full_name") || ""),
              password: String(form.get("password"))
            });
      setSession(response);
      toast(`Welcome${response.user.username ? ", " + response.user.username : ""}!`, "success");
      router.push("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Link href="/" className="mb-10 flex items-center gap-2 text-sm font-semibold text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-300 text-zinc-950">
          <Sparkles className="h-4 w-4" />
        </span>
        ORIGIN AI
      </Link>

      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-white">
          {mode === "login" ? "Welcome back" : "Create your workspace"}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          {mode === "login"
            ? "Sign in to continue your local AI workflow."
            : "Set up your personal AI workspace in seconds."}
        </p>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          {mode === "register" ? (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Username</label>
                <Input name="username" placeholder="Your username" minLength={2} required className="border-white/10 bg-white/[0.04]" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Full name</label>
                <Input name="full_name" placeholder="Optional" className="border-white/10 bg-white/[0.04]" />
              </div>
            </>
          ) : null}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Email</label>
            <Input name="email" type="email" placeholder="you@example.com" required className="border-white/10 bg-white/[0.04]" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Password</label>
            <Input name="password" type="password" placeholder="Min 8 characters" minLength={8} required className="border-white/10 bg-white/[0.04]" />
          </div>

          {error ? (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>
          ) : null}

          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === "login" ? "Sign in" : "Create account"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
          <Link className="font-medium text-cyan-200 hover:text-cyan-100" href={mode === "login" ? "/auth/register" : "/auth/login"}>
            {mode === "login" ? "Create one" : "Sign in"}
          </Link>
        </p>
      </div>

      <p className="mt-16 text-xs text-zinc-600">Self-hosted AI workspace · v0.1</p>
    </div>
  );
}
