"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/api";

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) setAuthed(true);
    }, 5000);
    isAuthenticated().then((ok) => {
      clearTimeout(timeout);
      if (cancelled) return;
      if (!ok) {
        router.replace("/auth/login");
        return;
      }
      setAuthed(true);
    });
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {children}

      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050506",
          zIndex: 100,
          opacity: authed ? 0 : 1,
          pointerEvents: authed ? "none" : "auto",
          transition: "opacity 0.2s",
        }}
      >
        <span className="text-sm text-zinc-400">Preparing workspace...</span>
      </div>
    </div>
  );
}
