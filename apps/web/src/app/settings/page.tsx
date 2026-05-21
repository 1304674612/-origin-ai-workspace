"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, User } from "lucide-react";
import { Button } from "@origin/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@origin/ui/components/card";
import { Input } from "@origin/ui/components/input";
import { api, clearSession } from "@/lib/api";
import type { User as UserType } from "@origin/shared";
import { useToast } from "@/lib/toast";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedPage } from "@/components/layout/protected-page";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Profile form
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");

  // Password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");

  const load = useCallback(async () => {
    try {
      const u = await api.me();
      setUser(u);
      setUsername(u.username);
      setFullName(u.full_name ?? "");
    } catch {
      toast("Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateMe({ username, full_name: fullName || undefined });
      setUser(updated);
      toast("Profile updated", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Update failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    if (newPw.length < 8) {
      toast("Password must be at least 8 characters", "error");
      return;
    }
    setSaving(true);
    try {
      await api.changePassword(currentPw, newPw);
      setCurrentPw("");
      setNewPw("");
      toast("Password changed", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Password change failed", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <ProtectedPage>
        <AppShell>
          <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        </AppShell>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <AppShell>
        <div className="mx-auto min-h-screen max-w-2xl px-5 py-10 md:px-10">
          <h1 className="text-2xl font-semibold text-white">Settings</h1>
          <p className="mt-1 text-sm text-zinc-400">{user?.email}</p>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-4 w-4" /> Profile</CardTitle>
              <CardDescription>Update your display name and username.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={saveProfile}>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Username</label>
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} minLength={2} required className="border-white/10 bg-white/[0.04]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Full name</label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Optional" className="border-white/10 bg-white/[0.04]" />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save changes
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Change password</CardTitle>
              <CardDescription>Use a strong password you do not use elsewhere.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={changePassword}>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Current password</label>
                  <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required className="border-white/10 bg-white/[0.04]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">New password</label>
                  <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} minLength={8} required className="border-white/10 bg-white/[0.04]" />
                </div>
                <Button type="submit" variant="secondary" disabled={saving}>
                  Change password
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 border-t border-white/10 pt-8">
            <Button
              variant="ghost"
              onClick={() => {
                clearSession();
                router.push("/auth/login");
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </AppShell>
    </ProtectedPage>
  );
}
