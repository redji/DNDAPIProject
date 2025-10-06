#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Installing frontend deps..."
npm install

echo "Running frontend dev build..."
npm run build


