#!/usr/bin/env bash
set -euo pipefail

task_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_file="$task_dir/backend/.env"
runtime_dir="$task_dir/node-red/runtime"

if [[ ! -f "$env_file" && -z "${ANTERAJA_INGEST_TOKEN:-}" ]]; then
  echo 'Laravel .env belum tersedia.' >&2
  exit 1
fi

if [[ -z "${ANTERAJA_INGEST_TOKEN:-}" ]]; then
  ANTERAJA_INGEST_TOKEN="$(sed -n 's/^ANTERAJA_INGEST_TOKEN=//p' "$env_file" | head -n 1)"
fi
if [[ -z "$ANTERAJA_INGEST_TOKEN" ]]; then
  echo 'ANTERAJA_INGEST_TOKEN belum diatur.' >&2
  exit 1
fi

mkdir -p "$runtime_dir"
if [[ ! -f "$runtime_dir/flows.json" ]]; then
  cp "$task_dir/node-red/flows.json" "$runtime_dir/flows.json"
fi

export ANTERAJA_INGEST_TOKEN
export ANTERAJA_API_BASE_URL="${ANTERAJA_API_BASE_URL:-http://127.0.0.1:8093}"

if [[ "${ANTERAJA_NODE_RED_MODE:-local}" == production ]]; then
  if [[ -z "${NODE_RED_CREDENTIAL_SECRET:-}" || -z "${NODE_RED_ADMIN_PASSWORD_HASH:-}" ]]; then
    echo 'NODE_RED_CREDENTIAL_SECRET dan NODE_RED_ADMIN_PASSWORD_HASH wajib diatur pada produksi.' >&2
    exit 1
  fi
  if [[ ${#NODE_RED_CREDENTIAL_SECRET} -lt 32 || ! "$NODE_RED_ADMIN_PASSWORD_HASH" =~ ^\$2[aby]\$ ]]; then
    echo 'Rahasia Node-RED harus >=32 karakter dan password harus berupa hash bcrypt.' >&2
    exit 1
  fi

  exec node-red --userDir "$runtime_dir" --settings "$task_dir/node-red/settings.production.js" --port 1880 "$runtime_dir/flows.json"
fi

exec node-red --userDir "$runtime_dir" --port 1880 "$runtime_dir/flows.json"
