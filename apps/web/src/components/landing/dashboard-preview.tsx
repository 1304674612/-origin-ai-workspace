"use client";

import { motion } from "framer-motion";
import { Activity, Bot, Database, Gauge, Server, Sparkles } from "lucide-react";

const rows = [
  { label: "OpenAI", value: "142 ms", ok: true },
  { label: "DeepSeek", value: "188 ms", ok: true },
  { label: "Qwen", value: "164 ms", ok: true },
  { label: "NAS", value: "local", ok: true }
];

export function DashboardPreview() {
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
            <h3 className="mt-2 text-xl font-semibold text-white">Personal AI control plane</h3>
          </div>
          <Sparkles className="h-5 w-5 text-cyan-200" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Bot, label: "Chats", value: "1,284" },
            { icon: Database, label: "Indexed docs", value: "426" },
            { icon: Gauge, label: "Tokens today", value: "58k" }
          ].map((item) => (
            <div key={item.label} className="rounded-md border border-white/10 bg-white/[0.04] p-4">
              <item.icon className="h-4 w-4 text-cyan-200" />
              <div className="mt-4 text-2xl font-semibold text-white">{item.value}</div>
              <div className="mt-1 text-xs text-zinc-400">{item.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex h-40 items-end gap-2 rounded-md border border-white/10 bg-zinc-950/70 p-4">
          {[44, 72, 54, 88, 63, 95, 76, 82, 68, 91, 73, 84].map((height, index) => (
            <motion.div
              key={index}
              className="flex-1 rounded-t bg-gradient-to-t from-cyan-300/30 to-emerald-200"
              initial={{ height: 10 }}
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.8, delay: index * 0.04 }}
            />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <Server className="h-4 w-4 text-emerald-200" />
            Model Status
          </div>
          <div className="mt-4 space-y-3">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">{row.label}</span>
                <span className="text-zinc-100">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <Activity className="h-4 w-4 text-cyan-200" />
            Automation Queue
          </div>
          <div className="mt-4 space-y-3 text-sm text-zinc-400">
            <p>RAG indexing: 18 chunks queued</p>
            <p>Workflow: summarize lab notes</p>
            <p>Agent: review pull request draft</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
