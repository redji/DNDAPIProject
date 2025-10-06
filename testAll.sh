#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "Running unit tests..."
npm run test:unit

echo "Running integration (gRPC) tests..."
npm run test:int

echo "Running E2E tests..."
npm run test:e2e

echo "All tests completed."


