#!/usr/bin/env bash
# One-shot local setup. Safe to re-run.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "▶ copying .env files from .env.example where missing"
for f in .env apps/web/.env.local apps/mobile-web/.env.local apps/mobile/.env; do
  src_dir=$(dirname "$f")
  src="${src_dir}/.env.example"
  # root .env has .env.example too
  [[ "$f" == ".env" ]] && src=".env.example"
  if [[ -f "$src" && ! -f "$f" ]]; then
    cp "$src" "$f"
    echo "    + wrote $f"
  fi
done

echo "▶ installing workspace dependencies (npm install)"
npm install

cat <<EOF

✔ Setup done.

Next steps:
  1. Apply Supabase schema:     ./scripts/db-push.sh
  2. Seed demo data:            ./scripts/db-seed.sh
  3. Start the desktop site:    ./scripts/dev-web.sh
  4. Start the mobile debug UI: ./scripts/dev-mobile-web.sh
  5. Start the RN app:          ./scripts/dev-mobile.sh

EOF
