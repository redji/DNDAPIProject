#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Cleaning build directory..."
rm -rf "back-end/build"

cd "back-end"
npm run deps:install
echo "Generating protobuf/gRPC sources..."
chmod +x ./generate_protos.sh || true
./generate_protos.sh

echo "Ensuring database docker image is available..."
if command -v docker >/dev/null 2>&1; then
  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose pull || true
    docker-compose up -d || true
  else
    # docker compose (plugin)
    docker compose pull || true
    docker compose up -d || true
  fi
else
  echo "Warning: docker not found; skipping DB image pull/up" >&2
fi

echo "Configuring CMake..."
cmake -B build -S .

echo "Building backend..."
cmake --build build --config Release

echo "Building backend docker image (optional)..."
if command -v docker >/dev/null 2>&1; then
  docker build -t dnd5e-backend . || true
else
  echo "Warning: docker not found; skipping backend image build" >&2
fi

echo "Done. Binary: $ROOT_DIR/back-end/build/dnd5e-backend"