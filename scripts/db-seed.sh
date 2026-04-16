#!/usr/bin/env bash
# Runs the idempotent seed script against the remote DB (via session pooler).
# Requires psql on PATH. If psql isn't installed, run the contents of supabase/seed.sql
# from Supabase Studio → SQL Editor instead.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "✘ Export SUPABASE_DB_URL first (see .env.example)" >&2
  exit 1
fi

DB_URL="$SUPABASE_DB_URL"

if ! command -v psql >/dev/null 2>&1; then
  cat <<MSG
✘ psql not found on PATH.

Alternative: open Supabase Studio → SQL Editor (https://app.supabase.com/project/dgkmvoteliomghoctwrd/sql/new)
and paste the contents of supabase/seed.sql there.
MSG
  exit 1
fi

echo "▶ running supabase/seed.sql"
psql "$DB_URL" -f supabase/seed.sql
