#!/usr/bin/env bash
# start-tunnel-dev.sh — Launch a Cloudflare tunnel + Expo dev server in a
#                      single shell. Used when testing the Minga Expeditions
#                      mobile app from a phone on a different network.
#
# The script always starts a FRESH Metro/Expo process on an unused port so it
# won't attach to another project's dev server you already have running. It
# also clears Metro's project cache each run.
#
# Run in PowerShell:
#   & "C:\Program Files\Git\bin\bash.exe" .\scripts\start-tunnel-dev.sh
#   & "C:\Program Files\Git\bin\bash.exe" .\scripts\start-tunnel-dev.sh 8090
#
# Run in Git Bash:
#   ./scripts/start-tunnel-dev.sh             # auto-pick free port
#   ./scripts/start-tunnel-dev.sh 8090        # specific port
#   PORT=8090 ./scripts/start-tunnel-dev.sh   # env-var form
#
# Requires: npx (ships with npm), internet access so `npx cloudflared` can
# download the binary the first time.

set -euo pipefail

cd "$(dirname "$0")/.."

# ---------- port selection --------------------------------------------------
# Priority: CLI arg > $PORT env var > first free port in 8085..8199.
# A free port here means BOTH nothing is listening on it AND no Metro has
# claimed it for another project (we can't directly detect the second, so
# picking a truly unused socket is the most reliable proxy).

is_port_free() {
  local p=$1
  # Try every Windows/Unix probe we can. Returns 0 if free.
  if command -v ss >/dev/null 2>&1; then
    ! ss -ltn 2>/dev/null | awk '{print $4}' | grep -q ":$p$"
  elif command -v netstat >/dev/null 2>&1; then
    # Git Bash netstat lists ports as "0.0.0.0:8085" — match the trailing :port.
    ! netstat -an 2>/dev/null | grep -E "LISTENING|LISTEN" | grep -q ":$p "
  else
    # No probe available → assume free. User will see a clear error if not.
    return 0
  fi
}

pick_free_port() {
  for p in $(seq 8085 8199); do
    if is_port_free "$p"; then
      echo "$p"
      return 0
    fi
  done
  echo "ERROR: no free port found in 8085..8199. Pass one explicitly." >&2
  exit 1
}

REQUESTED_PORT="${1:-${PORT:-}}"
if [[ -n "$REQUESTED_PORT" ]]; then
  if ! is_port_free "$REQUESTED_PORT"; then
    echo "ERROR: port $REQUESTED_PORT is already in use. Pick another or run without args to auto-pick." >&2
    exit 1
  fi
  PORT="$REQUESTED_PORT"
else
  PORT=$(pick_free_port)
fi

TUNNEL_LOG=$(mktemp -t cloudflared.XXXXXX)
TUNNEL_PID=""

cleanup() {
  echo ""
  echo "Shutting down tunnel (port $PORT)..."
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

# ---------- pick a cloudflared binary ---------------------------------------
# Resolution order:
#   1. ./tools/cloudflared(.exe) — gitignored, auto-downloaded on Windows if
#      missing (the npm wrapper has no Windows ARM64 binary and silently
#      exits, so we sidestep it). The amd64 build runs fine on Windows-on-ARM
#      via Prism emulation.
#   2. cloudflared on PATH        — system-wide install (winget, brew, apt).
#   3. npx -y cloudflared         — last-resort fallback for non-Windows.
#
# If Windows Defender keeps quarantining tools/cloudflared.exe, run once
# (admin PowerShell):
#   Add-MpPreference -ExclusionPath "$PWD\tools"
ensure_local_cf_bin_windows() {
  # Only auto-download on Windows hosts (where MSYS exposes /c/...).
  [[ "$(uname -s 2>/dev/null)" == MINGW* || "$(uname -s 2>/dev/null)" == MSYS* || "$(uname -s 2>/dev/null)" == CYGWIN* ]] || return 1
  mkdir -p tools
  if [[ ! -x "./tools/cloudflared.exe" ]]; then
    echo "    fetching cloudflared-windows-amd64.exe (one-time, ~64MB) ..."
    if ! curl -fL --retry 3 -o tools/cloudflared.exe \
         https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe; then
      echo "ERROR: failed to download cloudflared. Check network/proxy or download manually." >&2
      return 1
    fi
    chmod +x tools/cloudflared.exe
  fi
  return 0
}

CF_BIN=""
if [[ -x "./tools/cloudflared.exe" ]]; then
  CF_BIN="./tools/cloudflared.exe"
elif [[ -x "./tools/cloudflared" ]]; then
  CF_BIN="./tools/cloudflared"
elif command -v cloudflared >/dev/null 2>&1; then
  CF_BIN="cloudflared"
elif ensure_local_cf_bin_windows && [[ -x "./tools/cloudflared.exe" ]]; then
  CF_BIN="./tools/cloudflared.exe"
fi

# ---------- cloudflare tunnel ----------------------------------------------
echo "▶ Starting Cloudflare tunnel on http://localhost:$PORT ..."
if [[ -n "$CF_BIN" ]]; then
  echo "    using $CF_BIN"
  "$CF_BIN" tunnel --url "http://localhost:$PORT" >"$TUNNEL_LOG" 2>&1 &
else
  echo "    using npx -y cloudflared (no local binary found)"
  npx -y cloudflared tunnel --url "http://localhost:$PORT" >"$TUNNEL_LOG" 2>&1 &
fi
TUNNEL_PID=$!

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
echo "  Project:      minga-expeditions"
echo "  Local port:   $PORT"
echo "  Tunnel URL:   $TUNNEL_URL"
echo "  Phone (Expo): exp://${TUNNEL_URL#https://}:443"
echo "================================================"
echo ""
echo "If Expo Go opens the wrong project, force-quit the app and paste the"
echo "exp:// URL above from your phone's clipboard, or scan the QR code"
echo "that appears below."
echo ""

# ---------- expo start ------------------------------------------------------
# EXPO_PACKAGER_PROXY_URL tells Metro to advertise the tunnel URL in its
# manifest instead of localhost, so the phone loads the bundle through the
# tunnel. We isolate each run by using a unique port AND clearing the cache.
export EXPO_PACKAGER_PROXY_URL="$TUNNEL_URL"
# Stop Expo from asking about / launching a dev client.
export EXPO_NO_DEV_CLIENT=1

cd apps/mobile

# Flags:
#   --port "$PORT"   — Metro listens here; matches the tunnel.
#   --clear          — wipe Metro cache so stale transform output from another
#                      project can't leak in.
#   --go             — force the bundle to target Expo Go (not a custom dev
#                      client bound to a different slug).
#   --offline is NOT set — we still want normal Expo auth so Expo Go can
#                          open the correct project by slug.
exec npx expo start --port "$PORT" --clear --go
