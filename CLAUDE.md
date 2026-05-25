# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend (from repo root)
npm run dev              # Next.js dev server (port 3000)
npm run build            # Production build (turbo)
npm run lint             # ESLint (turbo)
npm run typecheck        # tsc --noEmit (turbo)
npm run test             # Vitest unit tests (turbo)
npm run format           # Prettier

# Backend (requires apps/api/.venv)
python -m venv apps/api/.venv && apps/api/.venv/bin/pip install -e "apps/api[dev]"
npm run dev:api          # Uvicorn --reload on port 8000
npm run test:api         # pytest (unit + integration)

# Database
npm run api:migrate      # alembic upgrade head (in apps/api/)

# Docker
docker compose up -d     # Full stack: postgres, redis, api, web, nginx (port 8080)
```

## Architecture

**Monorepo** — npm workspaces across `apps/*` and `packages/*`. Node >= 20.18, Python >= 3.11.

| Path | Role |
|---|---|
| `apps/web/` | Next.js 15 App Router frontend (standalone output) |
| `apps/api/` | FastAPI backend (Python), layered: models → repositories → services → endpoints |
| `packages/ui/` | Shared React components (Radix + CVA) |
| `packages/shared/` | Shared TypeScript utilities |
| `packages/config/` | Shared config (env, constants) |

**Frontend** — Route groups: `auth`, `chat`, `dashboard`, `files`, `blog`, `settings`. Components follow feature-based organization under `src/components/<feature>/`. Next.js rewrites proxy `/api/*` to the FastAPI backend (`ORIGIN_API_URL` env var).

**Backend** — The `app/` package is layered bottom-up:
- `models/` — SQLAlchemy ORM models (pgvector for embeddings)
- `repositories/` — Data access, one repo per aggregate
- `services/` — Business logic (auth, chat, file, RAG, AI providers)
- `api/v1/endpoints/` — FastAPI route handlers (auth, chat, dashboard, files, knowledge, providers, system, users)
- `core/` — config, crypto, database session, JWT security, structured logging, rate limiting
- `schemas/` — Pydantic request/response models

**Docker Compose** — 5 services: postgres (pgvector/pg16), redis (7-alpine), api, web, nginx (reverse proxy on :8080). Health checks on all services.

## Key Patterns

- **Next.js standalone output** — `output: "standalone"` in next.config.ts, so `apps/web/server.js` is the production entry point
- **React 19.0.0 is pinned** (not `^19.0.0`) — workarounds exist for DOM reconciliation crashes (ProtectedPage uses opacity instead of conditional render, AppShell uses pathname key to force remount). Do not upgrade React without testing these paths
- **Backend repo pattern** — each data operation goes through a repository class; services call repos and contain business logic; endpoints only handle HTTP concerns
- **Rate limiting** is middleware-level (`app/middleware/rate_limit.py`), uses Redis
- **CI** (`.github/workflows/ci.yml`) runs on every push/PR to main: frontend (ESLint + typecheck + Vitest + build via Turbo), backend (Ruff + mypy + pytest + smoke-test), Docker builds for both. mypy skips `app/models/`, `app/repositories/`, `app/middleware/`, `app/services/ai/`, `app/services/files/`, `app/services/rag/` due to SQLAlchemy 2.0 / third-party stub gaps.
