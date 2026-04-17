#!/usr/bin/env bash
# Applies every migration in supabase/migrations against the remote project.
# Uses the Supabase CLI. Install via `npm i -g supabase` or `scoop install supabase`.
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v supabase >/dev/null 2>&1; then
  echo "✘ supabase CLI not found. Install it: npm i -g supabase" >&2
  exit 1
fi

if [[ -z "${SUPABASE_DB_URL:-}" && -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
  echo "✘ Export SUPABASE_DB_URL or SUPABASE_DB_PASSWORD first (see .env.example)" >&2
  exit 1
fi

DB_URL="${SUPABASE_DB_URL:-postgresql://postgres.<your-project>:${SUPABASE_DB_PASSWORD}@aws-1-us-west-2.pooler.supabase.com:5432/postgres}"

echo "▶ pushing schema migrations to Supabase"
supabase db push --db-url "$DB_URL"
