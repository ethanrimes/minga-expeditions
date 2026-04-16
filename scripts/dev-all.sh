#!/usr/bin/env bash
# Launches all three dev servers in parallel. Use in separate terminals instead
# if you want cleaner logs.
set -euo pipefail

cd "$(dirname "$0")/.."

trap 'kill $(jobs -p) 2>/dev/null || true' EXIT

npm run dev:web &
npm run dev:mobile-web &
npm run dev:mobile &

wait
