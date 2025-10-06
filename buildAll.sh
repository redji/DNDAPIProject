#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Building Backend ==="
"$ROOT_DIR/buildBackend.sh"

echo "=== Building Frontend ==="
"$ROOT_DIR/buildFrontend.sh"

echo "=== Building NGINX container with frontend ==="
if command -v docker >/dev/null 2>&1; then
  docker build -f "$ROOT_DIR/docker/nginx/Dockerfile" -t dnd5e-frontend "$ROOT_DIR"
else
  echo "Warning: docker not found; skipping NGINX image build" >&2
fi

echo "To run all services together:"
echo "  docker compose up -d"

echo "All done."

