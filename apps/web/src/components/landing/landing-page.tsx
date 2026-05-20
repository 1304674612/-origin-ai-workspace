"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bot, Boxes, Github, Layers3, LockKeyhole, Network, Rocket, Server } from "lucide-react";
import { Button } from "@origin/ui/components/button";
import { Badge } from "@origin/ui/components/badge";

import { DashboardPreview } from "./dashboard-preview";
import { ParticleField } from "./particle-field";

const features = [
  { icon: Bot, title: "AI Chat", text: "Streaming chat, Markdown, history, model controls, and provider switching." },
  { icon: Network, title: "RAG Core", text: "Chunking, document indexes, embeddings and vector store abstractions." },
  { icon: Boxes, title: "Plugins", text: "Designed for agents, workflows, MCP, and user-owned extensions." },
  { icon: Server, title: "NAS Ready", text: "Docker Compose, persistent data, reverse proxy, and local-first deployment." }
];

export function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      <section className="relative min-h-[92vh] px-6 pb-20 pt-6">
        <ParticleField />
        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-300 text-zinc-950">
              <Layers3 className="h-5 w-5" />
            </span>
            ORIGIN AI
          </Link>
          <div className="hidden items-center gap-6 text-sm text-zinc-400 md:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#deploy" className="hover:text-white">Deploy</a>
            <Link href="/blog" className="hover:text-white">Blog</Link>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/dashboard">Open App</Link>
            </Button>
          </div>
        </nav>

        <div className="relative z-10 mx-auto mt-24 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-4xl text-center"
          >
            <Badge className="mx-auto mb-6 w-fit">Self-hosted AI workspace v0.1</Badge>
            <h1 className="text-5xl font-semibold leading-tight tracking-normal text-white md:text-7xl">
              ORIGIN AI Workspace
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              A lightweight, modern, NAS-friendly AI workbench for chat, files, knowledge bases, agents,
              workflows, and personal automation.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/auth/register">
                  Start workspace <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <a href="https://github.com/1304674612/-origin-ai-workspace" target="_blank" rel="noreferrer">
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </Button>
            </div>
          </motion.div>
          <div className="mt-16">
            <DashboardPreview />
          </div>
        </div>
      </section>

      <section id="features" className="relative border-y border-white/10 bg-black/25 px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-4">
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur transition hover:border-cyan-300/20 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-cyan-300/5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-300/10 ring-1 ring-cyan-300/20 transition group-hover:bg-cyan-300/20">
                <feature.icon className="h-5 w-5 text-cyan-200" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-white transition group-hover:text-cyan-100">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{feature.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="deploy" className="px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <Badge variant="secondary">Docker first</Badge>
            <h2 className="mt-5 text-3xl font-semibold text-white md:text-5xl">Built for local ownership.</h2>
            <p className="mt-5 text-base leading-8 text-zinc-400">
              ORIGIN is designed around a production-style FastAPI backend, PostgreSQL, Redis, and a
              Next.js frontend. It keeps the first version compact while leaving clean extension points for
              RAG engines, agents, workflows, and plugins.
            </p>
            <div className="mt-8 flex gap-3">
              <Button asChild>
                <Link href="/dashboard">
                  Launch dashboard <Rocket className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/blog">Read roadmap</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-zinc-950 p-5 shadow-glow">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4 text-sm text-zinc-400">
              <LockKeyhole className="h-4 w-4 text-emerald-200" />
              One command deploy
            </div>
            <pre className="overflow-x-auto pt-5 text-sm leading-7 text-zinc-200">
              <code>{`cp .env.example .env
docker compose up -d --build

# web     http://localhost:3000
# api     http://localhost:8000
# nginx   http://localhost:8080`}</code>
            </pre>
          </div>
        </div>
      </section>
    </main>
  );
}
