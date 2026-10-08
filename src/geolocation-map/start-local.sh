#!/usr/bin/env bash
set -euo pipefail

task_map_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
task_map_port=${1:-8092}
task_map_key=$(sed -nE 's/^export const GOOGLE_MAPS_API_KEY = "([^"]+)";.*/\1/p' "$task_map_dir/config.local.js")

if [[ -z "$task_map_key" || "$task_map_key" == ISI_* ]]; then
  echo "Isi GOOGLE_MAPS_API_KEY di config.local.js terlebih dahulu." >&2
  exit 1
fi

# Untuk demo lokal, key yang sama dipakai oleh peta browser dan geocoding server.
# Jangan gunakan pola ini untuk produksi: gunakan key server terpisah yang terlindungi.
export GOOGLE_GEOCODING_API_KEY="$task_map_key"
unset task_map_key
exec php -S "127.0.0.1:$task_map_port" -t "$task_map_dir"
