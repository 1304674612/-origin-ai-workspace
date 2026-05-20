"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Bot, Database, Gauge, Server, Sparkles } from "lucide-react";
import { api, getToken, type DashboardStats } from "@/lib/api";
import { Badge } from "@origin/ui/components/badge";
import { Button } from "@origin/ui/components/button";

export function DashboardPreview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api.dashboard().then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (!getToken()) return null;

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="glass-panel mx-auto w-full max-w-5xl rounded-lg p-8 text-center"
      >
        <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300/60" />
          Loading workspace data...
        </div>
      </motion.div>
    );
  }

  if (!stats) return null;

  const cards = [
    { icon: Bot, label: "Conversations", value: stats.total_conversations.toLocaleString() },
    { icon: Database, label: "Indexed docs", value: stats.indexed_documents.toLocaleString() },
    { icon: Gauge, label: "Tokens today", value: stats.token_usage_today.toLocaleString() },
  ];

  const providerStatus = stats.provider_status || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="glass-panel relative mx-auto grid w-full max-w-5xl gap-4 rounded-lg p-4 md:grid-cols-[1.25fr_0.75fr]"
    >
      <div className="rounded-md border border-white/10 bg-black/30 p-4">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Workspace telemetry</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Personal AI workspace</h3>
          </div>
          <Sparkles className="h-5 w-5 text-cyan-200" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {cards.map((item) => (
            <div key={item.label} className="rounded-md border border-white/10 bg-white/[0.04] p-4">
              <item.icon className="h-4 w-4 text-cyan-200" />
              <div className="mt-4 text-2xl font-semibold tabular-nums text-white">{item.value}</div>
              <div className="mt-1 text-xs text-zinc-400">{item.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex h-40 items-end gap-2 rounded-md border border-white/10 bg-zinc-950/70 p-4">
          {stats.usage_series && stats.usage_series.length > 0 ? (
            stats.usage_series.slice(-12).map((point, index) => {
              const maxTokens = Math.max(...stats.usage_series.map((p) => p.tokens), 1);
              const height = Math.max(8, (point.tokens / maxTokens) * 100);
              return (
                <motion.div
                  key={index}
                  className="flex-1 rounded-t bg-gradient-to-t from-cyan-300/30 to-emerald-200"
                  initial={{ height: 10 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.8, delay: index * 0.04 }}
                />
              );
            })
          ) : (
            <div className="flex w-full items-center justify-center text-xs text-zinc-500">
              Start chatting to see token usage
            </div>
          )}
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <Server className="h-4 w-4 text-emerald-200" />
            Model Status
          </div>
          <div className="mt-4 space-y-3">
            {providerStatus.length > 0 ? (
              providerStatus.map((p) => (
                <div key={p.provider} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400 capitalize">{p.provider}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.configured ? "success" : "warning"}>
                      {p.configured ? "Ready" : "Needs key"}
                    </Badge>
                    {p.latency_ms && (
                      <span className="text-xs text-zinc-500">{p.latency_ms} ms</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">No providers configured</p>
            )}
          </div>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <Activity className="h-4 w-4 text-cyan-200" />
            Quick Actions
          </div>
          <div className="mt-4 space-y-2">
            <Button asChild variant="ghost" size="sm" className="w-full justify-start text-zinc-400 hover:text-white">
              <Link href="/chat">
                Start a new chat <ArrowRight className="ml-auto h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="w-full justify-start text-zinc-400 hover:text-white">
              <Link href="/dashboard">
                Open dashboard <ArrowRight className="ml-auto h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
