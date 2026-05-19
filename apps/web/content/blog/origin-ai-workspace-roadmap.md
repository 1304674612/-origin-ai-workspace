---
title: "ORIGIN AI Workspace Roadmap"
description: "How the first release grows from a lightweight AI chat workbench into a local-first automation platform."
date: "2026-05-19"
category: "Roadmap"
tags:
  - AI Workspace
  - RAG
  - Self-hosting
---

ORIGIN AI Workspace starts with a practical v0.1 foundation: authentication, streaming chat, a model control surface, file intake, dashboard telemetry, and Docker-based deployment.

The important part is not the number of features. The important part is the architecture: provider abstraction, service and repository layers, a dedicated RAG indexing path, and deployment defaults that can survive beyond a weekend prototype.

## v0.1

- AI chat with streaming output.
- Login and registration with JWT.
- Dashboard for usage, model status, and workspace health.
- Docker Compose deployment with PostgreSQL and Redis.

## v0.2

The next milestone focuses on local knowledge:

```ts
type RetrievalPipeline = {
  parse: "pdf" | "docx" | "markdown" | "text";
  chunk: "semantic" | "recursive";
  embed: "openai" | "local";
  store: "pgvector" | "chroma" | "faiss";
};
```

This phase adds richer document parsing, vector retrieval, source citations, and a knowledge-base management UI.

## v0.3

Agents and workflows turn the workbench into an automation environment. The goal is to support repeatable tasks such as research summaries, code review preparation, study-note generation, and NAS media/library operations.

## v1.0

The long-term release is centered on a plugin ecosystem, MCP support, multi-user workspaces, and polished mobile flows.
