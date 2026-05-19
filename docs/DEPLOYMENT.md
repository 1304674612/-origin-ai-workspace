# Deployment Guide

## Docker Compose

```bash
cp .env.example .env
docker compose up -d --build
```

Open:

- Web: `http://localhost:3000`
- API: `http://localhost:8000`
- Nginx gateway: `http://localhost:8080`

## NAS Notes

Recommended NAS settings:

- Put PostgreSQL, Redis, and upload volumes on durable storage.
- Use the Nginx service behind the NAS reverse proxy.
- Set `APP_URL`, `API_URL`, and `NEXT_PUBLIC_API_URL` to your LAN or public host.
- Replace `JWT_SECRET_KEY` before exposing the service.
- Keep `client_max_body_size` in Nginx aligned with `MAX_UPLOAD_SIZE_MB`.

## Reverse Proxy

For external reverse proxies, route:

- `/` to `web:3000`
- `/api` to `api:8000`
- `/health` to `api:8000/health`

SSE chat streaming uses standard HTTP chunking. Keep proxy buffering disabled if your outer proxy buffers upstream responses.
