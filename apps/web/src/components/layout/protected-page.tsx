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

  const showLoader = !mounted || !ready;

  return (
    <>
      <div
        aria-hidden={!showLoader}
        style={{ display: showLoader ? undefined : "none" }}
        className="flex min-h-screen items-center justify-center bg-[#050506] text-sm text-zinc-400"
      >
        Preparing workspace...
      </div>
      <div style={{ display: showLoader ? "none" : undefined }}>
        {children}
      </div>
    </>
  );
}
