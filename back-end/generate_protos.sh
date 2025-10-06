#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$ROOT_DIR/build/generated"
PROTO_DIR="$ROOT_DIR/proto"

mkdir -p "$OUT_DIR"

echo "Generating C++ protobuf and gRPC sources..."

if ! command -v protoc >/dev/null 2>&1; then
  echo "Error: protoc not found. Install protobuf-compiler." >&2
  exit 1
fi

if ! command -v grpc_cpp_plugin >/dev/null 2>&1; then
  echo "Error: grpc_cpp_plugin not found. Install protobuf-compiler-grpc or gRPC C++." >&2
  exit 1
fi

protoc \
  -I"$PROTO_DIR" \
  --cpp_out="$OUT_DIR" \
  --grpc_out="$OUT_DIR" \
  --plugin=protoc-gen-grpc="$(which grpc_cpp_plugin)" \
  "$PROTO_DIR/dnd5e.proto"

echo "Done. Generated files in $OUT_DIR"

