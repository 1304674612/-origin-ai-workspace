"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);
  const showLoader = !mounted || !authed;

  useEffect(() => {
    setMounted(true);
    if (!getToken()) {
      router.replace("/auth/login");
      return;
    }
    setAuthed(true);
  }, []);

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Content always rendered and visible — prevents React DOM reconciliation errors */}
      <div style={{ visibility: showLoader ? "hidden" : "visible" }}>
        {children}
      </div>

      {/* Loader as an overlay on top of content */}
      {showLoader ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#050506",
            zIndex: 10,
          }}
        >
          <span className="text-sm text-zinc-400">Preparing workspace...</span>
        </div>
      ) : null}
    </div>
  );
}
