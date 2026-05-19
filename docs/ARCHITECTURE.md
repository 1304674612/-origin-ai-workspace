# ORIGIN AI Workspace Architecture

ORIGIN AI Workspace uses a monorepo with a Next.js frontend, FastAPI backend, shared TypeScript packages, and Docker Compose deployment.

## Backend Layers

- `api/v1/endpoints`: HTTP and streaming route definitions.
- `services`: business logic for authentication, chat, files, AI providers, and RAG indexing.
- `repositories`: database access for SQLAlchemy models.
- `models`: database schema and relationships.
- `schemas`: Pydantic request and response contracts.
- `core`: configuration, security, logging, database sessions, and exception handling.

The backend keeps provider-specific AI code behind `AIProvider`. OpenAI, DeepSeek, Qwen, and compatible endpoints are implemented through the OpenAI SDK-compatible streaming client.

## RAG Extension Points

- `TextChunker`: deterministic chunking for text payloads.
- `EmbeddingProvider`: interface for OpenAI, local, or future model embeddings.
- `VectorStore`: interface for Chroma, FAISS, Milvus, pgvector, or custom stores.
- `IndexingService`: connects parsed files to document and chunk records.

## Frontend Structure

- `src/app`: App Router pages.
- `src/components/landing`: public landing experience.
- `src/components/dashboard`: workspace telemetry UI.
- `src/components/chat`: streaming chat client.
- `src/components/files`: upload and preview workflow.
- `src/lib/api.ts`: browser API client and SSE parser.
- `packages/ui`: shadcn-style reusable primitives.

## Deployment

Docker Compose runs:

- `web`: Next.js app.
- `api`: FastAPI app with Alembic migration on start.
- `postgres`: durable relational data.
- `redis`: cache and future distributed rate limiting/queues.
- `nginx`: reverse proxy for NAS and Linux hosts.
