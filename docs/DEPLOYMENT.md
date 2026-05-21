# Deployment Guide

## Docker Compose (Recommended)

```bash
cp .env.docker.example .env
openssl rand -hex 32
# Paste the generated value into JWT_SECRET_KEY in .env
# Add your AI provider API keys (DEEPSEEK_API_KEY, OPENAI_API_KEY, etc.)
docker compose up -d --build
```

Open `http://localhost:8080`.

The web app uses same-origin API requests by default (`/api`). Nginx proxies `/api/*` to FastAPI, so browsers use the current host instead of a baked-in `localhost` address.

## Local Development

Run PostgreSQL and Redis locally, then:

```bash
cp .env.local.example .env
openssl rand -hex 32
# Paste the generated value into JWT_SECRET_KEY.
npm install
```

Backend:

```bash
python3.11 -m venv apps/api/.venv
apps/api/.venv/bin/pip install -e "apps/api[dev]"
npm run api:migrate
npm run dev:api
```

Frontend:

```bash
npm run dev:web
```

Open `http://localhost:3000`. During local development, Next.js rewrites `/api/*` to the backend.

## Environment Files

| File | Purpose |
|------|---------|
| `.env.example` | Minimal template for quick start |
| `.env.local.example` | Local development with `localhost` services and `./uploads` |
| `.env.docker.example` | Docker/NAS deployment with container hostnames and `/app/uploads` |

`JWT_SECRET_KEY` is required and must be at least 32 characters. Generate it with `openssl rand -hex 32`.

## NAS Notes

- Put PostgreSQL, Redis, and upload volumes on durable storage.
- Use the Nginx service behind the NAS reverse proxy.
- Set `APP_URL` and `API_URL` to your LAN or public host.
- Replace `JWT_SECRET_KEY` and `POSTGRES_PASSWORD` before exposing the service.
- Keep `client_max_body_size` in Nginx aligned with `MAX_UPLOAD_SIZE_MB`.

## Reverse Proxy

For external reverse proxies, route:

- `/` to `web:3000`
- `/api` to `api:8000`
- `/health` to `api:8000/health`

SSE chat streaming uses standard HTTP chunking. Keep proxy buffering disabled if your outer proxy buffers upstream responses.

## Updating

```bash
cd origin-ai-workspace
bash scripts/update.sh
```

Or manually:

```bash
git pull origin main
docker compose up -d --build
```
