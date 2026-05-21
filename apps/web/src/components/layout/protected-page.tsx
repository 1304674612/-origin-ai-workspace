"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/auth/login");
      return;
    }
    setAuthed(true);
  }, []);

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Content always mounted — no DOM reconciliation on auth transition */}
      {children}

      {/* Loader stays in DOM forever, only CSS opacity changes. No removeChild/insertBefore. */}
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
