#!/usr/bin/env bash
set -euo pipefail

task_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_file="$task_dir/backend/.env"
runtime_dir="$task_dir/node-red/runtime"

if [[ ! -f "$env_file" ]]; then
  echo 'Laravel .env belum tersedia.' >&2
  exit 1
fi

ANTERAJA_INGEST_TOKEN="$(sed -n 's/^ANTERAJA_INGEST_TOKEN=//p' "$env_file" | head -n 1)"
if [[ -z "$ANTERAJA_INGEST_TOKEN" ]]; then
  echo 'ANTERAJA_INGEST_TOKEN belum diatur.' >&2
  exit 1
fi

mkdir -p "$runtime_dir"
if [[ ! -f "$runtime_dir/flows.json" ]]; then
  cp "$task_dir/node-red/flows.json" "$runtime_dir/flows.json"
fi

export ANTERAJA_INGEST_TOKEN
export ANTERAJA_API_BASE_URL=http://127.0.0.1:8093
exec node-red --userDir "$runtime_dir" --port 1880 "$runtime_dir/flows.json"
