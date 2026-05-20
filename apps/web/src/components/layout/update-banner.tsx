"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { api, type UpdateCheck } from "@/lib/api";

export function UpdateBanner() {
  const [update, setUpdate] = useState<UpdateCheck | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    api.updateCheck().then(setUpdate).catch(() => {});
  }, []);

  if (!update?.update_available || dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-4 border-b border-cyan-300/20 bg-cyan-300/10 px-4 py-2.5 text-sm backdrop-blur">
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 rounded-full bg-cyan-300/20 px-2 py-0.5 text-xs font-medium text-cyan-200">New</span>
        <span className="truncate text-zinc-300">
          <span className="font-medium text-white">{update.release_name || update.latest_version}</span>
          {" "}is available. You are on {update.current_version}.
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <a
          href={update.release_url || "#"}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 rounded-md bg-cyan-300/20 px-3 py-1 text-xs font-medium text-cyan-200 transition hover:bg-cyan-300/30"
        >
          View release <ArrowUpRight className="h-3 w-3" />
        </a>
        <button
          onClick={() => setDismissed(true)}
          className="rounded p-1 text-zinc-500 hover:text-white"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
