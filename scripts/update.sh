#!/usr/bin/env bash
set -euo pipefail

echo "========================================"
echo " ORIGIN AI Workspace - Updater"
echo "========================================"
echo ""

# Check if running in the project directory
if [ ! -f "docker-compose.yml" ]; then
  echo "ERROR: Run this script from the ORIGIN AI Workspace directory."
  exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
  echo "WARNING: .env not found. Copy .env.example to .env first if needed."
fi

echo "[1/3] Pulling latest changes from GitHub..."
git pull origin main

echo ""
echo "[2/3] Rebuilding containers..."
docker compose up -d --build

echo ""
echo "[3/3] Cleaning up old images..."
docker image prune -f

echo ""
echo "========================================"
echo " Update complete!"
echo " Open http://localhost:8080"
echo "========================================"
