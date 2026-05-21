"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Bot,
  FileText,
  HardDrive,
  MessageSquareText,
  Newspaper,
  RefreshCw,
  Server,
} from "lucide-react";
import { Badge } from "@origin/ui/components/badge";
import { Button } from "@origin/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@origin/ui/components/card";
import { cn } from "@origin/ui/lib/utils";
import { api, type DashboardSummary } from "@/lib/api";

const fallbackSummary: DashboardSummary = {
  conversations_count: 0,
  files_count: 0,
  blogs_count: 0,
  system_status: "ok",
  recent_conversations: [],
  recent_files: [],
  recent_blogs: [],
  services: [
    { name: "FastAPI", status: "ok" },
    { name: "PostgreSQL", status: "ok" },
    { name: "Redis", status: "ok" },
    { name: "RAG", status: "ok" },
  ],
};

type BlogItem = {
  slug: string;
  title: string;
  date: string;
};

function asArray<T>(arr: unknown): T[] {
  return Array.isArray(arr) ? (arr as T[]) : [];
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-white/[0.06]", className)} />;
}

function StatusBadge({ status }: { status: string }) {
  const ok = status === "ok";
  return <Badge variant={ok ? "success" : "warning"}>{ok ? "正常" : "异常"}</Badge>;
}

export function DashboardClient({ initialBlogs }: { initialBlogs: BlogItem[] }) {
  const [summary, setSummary] = useState<DashboardSummary>(fallbackSummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.dashboardSummary();
      const services = asArray<DashboardSummary["services"][number]>(data?.services);
      setSummary({
        conversations_count: data?.conversations_count ?? 0,
        files_count: data?.files_count ?? 0,
        blogs_count: data?.blogs_count ?? 0,
        system_status: data?.system_status ?? "ok",
        recent_conversations: asArray<DashboardSummary["recent_conversations"][number]>(data?.recent_conversations),
        recent_files: asArray<DashboardSummary["recent_files"][number]>(data?.recent_files),
        recent_blogs: asArray<DashboardSummary["recent_blogs"][number]>(data?.recent_blogs),
        services: services.length > 0 ? services : fallbackSummary.services,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
      setSummary(fallbackSummary);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const blogsCount = summary.blogs_count || initialBlogs.length;
  const recentBlogs = summary.recent_blogs.length > 0
    ? summary.recent_blogs
    : initialBlogs.slice(0, 5).map((p) => ({
        id: p.slug,
        title: p.title,
        created_at: p.date,
      }));

  const statCards = [
    {
      label: "会话数量",
      value: summary.conversations_count ?? 0,
      icon: MessageSquareText,
      tone: "text-cyan-200" as const,
      href: "/chat",
    },
    {
      label: "文件数量",
      value: summary.files_count ?? 0,
      icon: FileText,
      tone: "text-violet-200" as const,
      href: "/files",
    },
    {
      label: "博客文章",
      value: blogsCount,
      icon: Newspaper,
      tone: "text-emerald-200" as const,
      href: "/blog",
    },
    {
      label: "系统状态",
      value: summary.system_status === "ok" ? "正常" : "异常",
      icon: Activity,
      tone: summary.system_status === "ok" ? ("text-emerald-200" as const) : ("text-amber-200" as const),
      href: null as string | null,
    },
  ];

  const conversations = summary.recent_conversations;
  const files = summary.recent_files;
  const services = summary.services;

  return (
    <div className="min-h-screen px-5 py-8 md:px-10">
      {/* Header */}
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="secondary">工作区</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-normal text-white md:text-4xl">仪表板</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            查看工作区运行状态、会话、文件与博客概览
          </p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          刷新
        </Button>
      </div>

      {/* Error banner */}
      {error ? (
        <div className="mt-6 rounded-md border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
          {error} — 已展示缓存数据
        </div>
      ) : null}

      {/* Stat cards */}
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label} className="transition hover:border-white/20 hover:bg-white/[0.06]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>{card.label}</CardDescription>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/10">
                  <card.icon className={cn("h-4 w-4", card.tone)} />
                </span>
              </div>
              <CardTitle className="text-3xl tabular-nums">
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : typeof card.value === "number" ? (
                  card.value.toLocaleString()
                ) : (
                  card.value
                )}
              </CardTitle>
            </CardHeader>
            {card.href ? (
              <CardContent className="pt-0">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-zinc-400 hover:text-white"
                >
                  <Link href={card.href}>
                    查看详情 <ArrowUpRight className="ml-auto h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            ) : null}
          </Card>
        ))}
      </div>

      {/* Recent items grid */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {/* Recent conversations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquareText className="h-4 w-4 text-cyan-200" />
              最近会话
            </CardTitle>
            <CardDescription>最近的对话记录</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : conversations.length > 0 ? (
              conversations.slice(0, 5).map((item) => (
                <Link
                  key={String(item.id)}
                  href={`/chat?id=${item.id}`}
                  className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] p-3 transition hover:border-cyan-300/30 hover:bg-white/[0.08]"
                >
                  <Bot className="h-4 w-4 shrink-0 text-cyan-200" />
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-300">
                    {item.title || "未命名会话"}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                </Link>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-zinc-500">
                <MessageSquareText className="mx-auto mb-2 h-6 w-6 text-zinc-600" />
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent files */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-violet-200" />
              最近文件
            </CardTitle>
            <CardDescription>最近上传的文件</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : files.length > 0 ? (
              files.slice(0, 5).map((item) => (
                <Link
                  key={String(item.id)}
                  href="/files"
                  className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] p-3 transition hover:border-violet-300/30 hover:bg-white/[0.08]"
                >
                  <HardDrive className="h-4 w-4 shrink-0 text-violet-200" />
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-300">
                    {item.title || "未命名文件"}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                </Link>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-zinc-500">
                <FileText className="mx-auto mb-2 h-6 w-6 text-zinc-600" />
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent blogs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Newspaper className="h-4 w-4 text-emerald-200" />
              最近博客
            </CardTitle>
            <CardDescription>最近发布的文章</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : recentBlogs.length > 0 ? (
              recentBlogs.slice(0, 5).map((item) => (
                <Link
                  key={String(item.id)}
                  href={`/blog/${item.id}`}
                  className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] p-3 transition hover:border-emerald-300/30 hover:bg-white/[0.08]"
                >
                  <Newspaper className="h-4 w-4 shrink-0 text-emerald-200" />
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-300">
                    {item.title || "未命名文章"}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                </Link>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-zinc-500">
                <Newspaper className="mx-auto mb-2 h-6 w-6 text-zinc-600" />
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Service status */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4 text-cyan-200" />
              本地优先栈状态
            </CardTitle>
            <CardDescription>FastAPI、PostgreSQL、Redis、RAG 服务运行状态</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((svc) => (
                <div key={svc.name} className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{svc.name}</span>
                    <StatusBadge status={svc.status} />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        svc.status === "ok" ? "bg-emerald-400" : "bg-amber-400"
                      )}
                    />
                    <span className="text-xs text-zinc-400">
                      {svc.status === "ok" ? "运行中" : "异常"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
