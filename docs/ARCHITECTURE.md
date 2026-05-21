# ORIGIN AI Workspace Architecture

ORIGIN AI Workspace uses a monorepo with a Next.js frontend, FastAPI backend, shared TypeScript packages, and Docker Compose deployment.

## Backend Layers

- `api/v1/endpoints`: HTTP and streaming route definitions (auth, chat, users, files, providers, dashboard, knowledge, system).
- `services`: business logic for authentication, chat, files, AI providers, knowledge generation, and RAG indexing.
- `repositories`: database access for SQLAlchemy models (chat, files, users, RAG, knowledge, providers).
- `models`: database schema and relationships (user, chat, file, RAG, provider, knowledge base, embedding).
- `schemas`: Pydantic request and response contracts with validation.
- `core`: configuration, security, crypto, logging, database sessions, and exception handling.

The backend keeps provider-specific AI code behind `AIProvider`. OpenAI, DeepSeek, Qwen, and compatible endpoints are implemented through the OpenAI SDK-compatible streaming client.

## RAG Pipeline

Implemented in `services/rag/`:

- `chunker.py`: Text chunking for document ingestion.
- `embeddings/`: Embedding providers — `local.py` (sentence-transformers) and `openai.py` (OpenAI embeddings API).
- `vectorstores/postgres.py`: pgvector-based vector store for similarity search.
- `indexing_service.py`: Orchestrates document parsing → chunking → embedding → vector storage.

Knowledge base models support AI-generated documents alongside file-derived RAG documents.

## Frontend Structure

- `src/app`: App Router pages (landing, auth, dashboard, chat, files, blog, settings).
- `src/components/landing`: Public landing page with particle animations and real-time dashboard preview.
- `src/components/dashboard`: Workspace telemetry with usage charts and provider health cards.
- `src/components/chat`: Streaming chat client with Markdown rendering, model controls, conversation management.
- `src/components/files`: Multi-file drag-and-drop upload with text extraction preview.
- `src/components/layout`: AppShell sidebar, ProtectedPage auth guard, desktop pet entry point.
- `src/lib/api.ts`: Browser API client with SSE parser, same-origin support.
- `packages/ui`: shadcn-style reusable primitives (Button, Card, Input, Select, etc.).
- `packages/shared`: Shared TypeScript types for API contracts.

## Deployment

Docker Compose runs:

- `web`: Next.js production server.
- `api`: FastAPI app with Alembic migration on start.
- `postgres`: PostgreSQL 16 with persistent volume.
- `redis`: Redis 7 for caching and rate limiting.
- `nginx`: Reverse proxy with same-origin API routing.
