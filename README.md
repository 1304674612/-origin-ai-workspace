# ORIGIN AI Workspace

ORIGIN AI Workspace is a modern self-hosted AI workbench for developers, students, NAS users, and personal workflows. It combines AI chat, multi-model configuration, local files, an extensible RAG foundation, and production-oriented deployment in a lightweight monorepo.

> v0.1 is designed as a real foundation: runnable frontend, FastAPI backend, authentication, chat persistence, upload pipeline, RAG abstractions, Docker Compose, Nginx, and a maintainable architecture for future releases.

## Features

- JWT authentication with registration, login, password hashing, session persistence, and user profile APIs.
- ChatGPT-style AI chat with streaming responses, Markdown rendering, code highlighting, session sidebar, model switching, temperature, max tokens, system prompt, copy, stop, and regenerate-ready API shape.
- Provider architecture for OpenAI, DeepSeek, Qwen, and OpenAI-compatible APIs.
- Dashboard with model health cards, token usage, latency chart, system status, and quick actions.
- File upload for PDF, TXT, Markdown, DOCX, and images with parser hooks and upload history.
- RAG-ready architecture: vector store abstraction, embedding service interface, chunking pipeline, document indexing models, and retrieval service.
- Markdown blog engine with tags, article pages, syntax highlighting, and dark-mode reading experience.
- Production-minded FastAPI structure: API versioning, services, repositories, middleware, logging, exception handling, rate limiting, SQLAlchemy, Alembic, PostgreSQL, and Redis.
- Docker Compose stack with web, API, PostgreSQL, Redis, and Nginx reverse proxy.
- Responsive dark glass UI built with Next.js 15, TypeScript, TailwindCSS, shadcn-style primitives, and Framer Motion.

## Screenshots

UI screenshots will be added under `docs/assets` as the product evolves.

## Tech Stack

- Frontend: Next.js 15, React 19, TypeScript, TailwindCSS, Framer Motion, shadcn-style UI primitives.
- Backend: FastAPI, Python 3.11, SQLAlchemy 2, Alembic, Pydantic Settings.
- Data: PostgreSQL, Redis.
- AI: OpenAI SDK-compatible streaming, provider abstraction, RAG service interfaces.
- Deploy: Docker, Docker Compose, Nginx.

## Repository Structure

```txt
apps/
  web/      Next.js application
  api/      FastAPI application
packages/
  ui/       Shared UI primitives
  config/   Shared config presets
  shared/   Shared TypeScript types
docker/
  nginx/    Reverse proxy config
docs/       Architecture and deployment docs
```

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev:api
npm run dev:web
```

The web app runs at [http://localhost:3000](http://localhost:3000). The API runs at [http://localhost:8000](http://localhost:8000).

For local API development, create a Python 3.11 virtual environment and install dependencies:

```bash
cd apps/api
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Docker Deployment

```bash
cp .env.example .env
docker compose up -d --build
```

Services:

- Web: `http://localhost:3000`
- API: `http://localhost:8000`
- Nginx gateway: `http://localhost:8080`
- PostgreSQL: persistent volume `postgres_data`
- Redis: persistent volume `redis_data`
- Uploads: persistent volume `uploads_data`

## Environment

Important variables:

- `JWT_SECRET_KEY`: must be changed in production.
- `DATABASE_URL`: SQLAlchemy async PostgreSQL connection URL.
- `REDIS_URL`: Redis connection URL for cache and rate limiting.
- `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, `QWEN_API_KEY`: provider credentials.
- `OPENAI_COMPATIBLE_BASE_URL`: custom provider base URL.
- `NEXT_PUBLIC_API_URL`: browser-facing API URL.

## Roadmap

### v0.1

- AI Chat
- Login authentication
- Dashboard
- Docker deployment

### v0.2

- Local knowledge base
- Document parsing
- Vector retrieval

### v0.3

- AI Agent
- Workflow builder
- Automation triggers

### v1.0

- Plugin ecosystem
- MCP support
- Multi-user workspaces
- Mobile-first polish

## Contributing

Contributions are welcome. Please keep changes small, typed, tested when possible, and aligned with the existing architecture:

1. Open an issue or discussion for larger design changes.
2. Create a focused branch.
3. Run frontend type checks and backend tests.
4. Submit a PR with a clear description and UI screenshots when relevant.

## License

MIT
