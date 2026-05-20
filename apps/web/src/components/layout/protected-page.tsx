"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!getToken()) {
      router.replace("/auth/login");
      return;
    }
    setReady(true);
  }, []);

  if (!mounted || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050506] text-sm text-zinc-400">
        Preparing workspace...
      </div>
    );
  }

  return <div key="protected-content">{children}</div>;
}
