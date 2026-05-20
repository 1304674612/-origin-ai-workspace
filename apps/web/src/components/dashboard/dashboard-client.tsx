"use client";

import { useEffect, useState } from "react";
import { Activity, Bot, Database, FileText, MessageSquareText, RefreshCw, Server } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@origin/ui/components/badge";
import { Button } from "@origin/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@origin/ui/components/card";
import { api, type DashboardStats } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedPage } from "@/components/layout/protected-page";

const fallbackStats: DashboardStats = {
  total_conversations: 0,
  total_messages: 0,
  total_files: 0,
  indexed_documents: 0,
  token_usage_today: 0,
  provider_status: [],
  usage_series: []
};

export function DashboardClient() {
  const [stats, setStats] = useState<DashboardStats>(fallbackStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setStats(await api.dashboard());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard";
      setError(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const cards = [
    { label: "Conversations", value: stats.total_conversations, icon: MessageSquareText, tone: "text-cyan-200" },
    { label: "Messages", value: stats.total_messages, icon: Bot, tone: "text-emerald-200" },
    { label: "Files", value: stats.total_files, icon: FileText, tone: "text-violet-200" },
    { label: "Indexed Docs", value: stats.indexed_documents, icon: Database, tone: "text-amber-200" }
  ];

  return (
    <ProtectedPage>
      <AppShell>
        <div className="min-h-screen px-5 py-8 md:px-10">
          <PageHeader
            eyebrow="Workspace"
            title="Command center"
            description="Monitor model health, chat activity, token usage, files, and the local RAG pipeline from one dense workspace surface."
            action={
              <Button variant="secondary" onClick={load} disabled={loading}>
                <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                Refresh
              </Button>
            }
          />

          {error ? <div className="mt-6 rounded-md border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">{error}</div> : null}

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <Card key={card.label}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription>{card.label}</CardDescription>
                    <card.icon className={`h-5 w-5 ${card.tone}`} />
                  </div>
                  <CardTitle className="text-3xl">{card.value.toLocaleString()}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_0.55fr]">
            <Card>
              <CardHeader>
                <CardTitle>Token usage and latency</CardTitle>
                <CardDescription>Streaming workload trend for the current workspace.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.usage_series}>
                      <defs>
                        <linearGradient id="tokens" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#67e8f9" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#67e8f9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="label" stroke="#71717a" tickLine={false} axisLine={false} />
                      <YAxis stroke="#71717a" tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }}
                      />
                      <Area type="monotone" dataKey="tokens" stroke="#67e8f9" fill="url(#tokens)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model status</CardTitle>
                <CardDescription>Configured provider readiness.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.provider_status.map((provider) => (
                  <div key={provider.provider} className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium text-white">
                        <Server className="h-4 w-4 text-cyan-200" />
                        {provider.provider}
                      </div>
                      <Badge variant={provider.configured ? "success" : "warning"}>
                        {provider.configured ? "Ready" : "Needs key"}
                      </Badge>
                    </div>
                    <div className="mt-3 flex justify-between text-sm text-zinc-400">
                      <span>{provider.default_model ?? "custom"}</span>
                      <span>{provider.latency_ms ?? "-"} ms</span>
                    </div>
                  </div>
                ))}
                <div className="rounded-md border border-white/10 bg-cyan-300/8 p-4 text-sm text-cyan-100">
                  <Activity className="mb-2 h-4 w-4" />
                  Token usage today: {stats.token_usage_today.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    </ProtectedPage>
  );
}
