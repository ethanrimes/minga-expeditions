#!/usr/bin/env bash
# start-tunnel-dev.sh — Launch a Cloudflare tunnel + Expo dev server in a
#                      single shell. Used when testing the Minga Expeditions
#                      mobile app from a phone on a different network.
#
# Run in PowerShell:
#   & "C:\Program Files\Git\bin\bash.exe" .\scripts\start-tunnel-dev.sh
#
# Run in Git Bash:
#   ./scripts/start-tunnel-dev.sh
#
# Requires: npx (ships with npm), internet access so `npx cloudflared` can
# download the binary the first time.

set -euo pipefail

cd "$(dirname "$0")/.."

PORT=8085
TUNNEL_LOG=$(mktemp -t cloudflared.XXXXXX)
TUNNEL_PID=""

cleanup() {
  echo ""
  echo "Shutting down tunnel..."
  if [[ -n "$TUNNEL_PID" ]] && kill -0 "$TUNNEL_PID" 2>/dev/null; then
    kill "$TUNNEL_PID" 2>/dev/null || true
    # On Windows Git Bash, also taskkill the child cloudflared.exe if present.
    if command -v taskkill &>/dev/null; then
      taskkill //F //T //PID "$TUNNEL_PID" &>/dev/null || true
    fi
  fi
  rm -f "$TUNNEL_LOG"
}
trap cleanup EXIT INT TERM

echo "Starting Cloudflare tunnel on http://localhost:$PORT ..."
npx -y cloudflared tunnel --url "http://localhost:$PORT" >"$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!

# Wait up to ~30s for the trycloudflare.com URL to appear in the log.
TUNNEL_URL=""
for _ in $(seq 1 60); do
  TUNNEL_URL=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1 || true)
  if [[ -n "$TUNNEL_URL" ]]; then
    break
  fi
  if ! kill -0 "$TUNNEL_PID" 2>/dev/null; then
    echo "ERROR: cloudflared exited before a URL was produced." >&2
    cat "$TUNNEL_LOG" >&2
    exit 1
  fi
  sleep 0.5
done

if [[ -z "$TUNNEL_URL" ]]; then
  echo "ERROR: Tunnel URL not found after 30s. cloudflared log:" >&2
  cat "$TUNNEL_LOG" >&2
  exit 1
fi

echo ""
echo "================================================"
echo "  Tunnel URL:   $TUNNEL_URL"
echo "  Phone (web):  $TUNNEL_URL"
echo "  Phone (Expo): exp://${TUNNEL_URL#https://}:443"
echo "================================================"
echo ""
echo "Open Expo Go on your phone and paste the exp:// URL above,"
echo "or scan the QR code that will appear below once Expo starts."
echo ""

export EXPO_PACKAGER_PROXY_URL="$TUNNEL_URL"

# Run Expo from the mobile app workspace. --port keeps everything on PORT.
cd apps/mobile
npx expo start --port "$PORT"
