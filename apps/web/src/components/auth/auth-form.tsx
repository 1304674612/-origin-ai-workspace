"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@origin/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@origin/ui/components/card";
import { Input } from "@origin/ui/components/input";
import { api, setSession } from "@/lib/api";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Welcome back" : "Create workspace"}</CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Sign in to continue your local AI workflow."
            : "Create the first ORIGIN AI account for this instance."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          {mode === "register" ? (
            <>
              <Input name="username" placeholder="Username" minLength={2} required />
              <Input name="full_name" placeholder="Full name" />
            </>
          ) : null}
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="password" type="password" placeholder="Password" minLength={8} required />
          {error ? <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p> : null}
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === "login" ? "Log in" : "Create account"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-zinc-400">
          {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
          <Link className="text-cyan-200 hover:text-cyan-100" href={mode === "login" ? "/auth/register" : "/auth/login"}>
            {mode === "login" ? "Register" : "Log in"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
