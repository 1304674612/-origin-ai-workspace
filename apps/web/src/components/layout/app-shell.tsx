"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Files, LayoutDashboard, LogOut, MessageSquareText, Newspaper, Settings, Sparkles } from "lucide-react";
import { Button } from "@origin/ui/components/button";
import { cn } from "@origin/ui/lib/utils";
import { clearSession } from "@/lib/api";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageSquareText },
  { href: "/files", label: "Files", icon: Files },
  { href: "/blog", label: "Blog", icon: Newspaper },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#050506]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 bg-zinc-950/82 p-4 backdrop-blur-xl lg:block">
        <Link href="/" className="flex items-center gap-3 rounded-md px-2 py-3 text-sm font-semibold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-300 text-zinc-950">
            <Sparkles className="h-5 w-5" />
          </span>
          ORIGIN AI
        </Link>
        <div className="mt-8 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/8 hover:text-white",
                (pathname === item.href || pathname.startsWith(item.href + "/")) && "bg-white/10 text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>
        <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <BarChart3 className="h-4 w-4 text-cyan-200" />
            Local-first stack
          </div>
          <p className="mt-2 text-xs leading-5 text-zinc-400">FastAPI, PostgreSQL, Redis, RAG-ready services.</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-start"
            onClick={async () => {
              await clearSession();
              router.push("/auth/login");
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/80 px-3 py-2 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm font-semibold text-white">
            <Sparkles className="h-4 w-4 text-cyan-200" />
            ORIGIN
          </Link>
          <div className="flex gap-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-2.5 py-2 text-xs text-zinc-400 transition",
                  (pathname === item.href || pathname.startsWith(item.href + "/")) && "bg-white/10 text-white"
                )}
              >
                <item.icon className="mx-auto h-4 w-4" />
                <span className="mt-0.5 block">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="lg:pl-72">{children}</main>
    </div>
  );
}
