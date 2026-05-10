#!/usr/bin/env bash
# start-tailscale-dev.sh — Run Expo bound to your Tailscale IP so a phone
#                         joined to the same tailnet connects directly. No
#                         tunnel needed; works through corporate Wi-Fi that
#                         blocks Cloudflare/ngrok edges.
#
# One-time setup:
#   laptop: winget install --id Tailscale.Tailscale   (or https://tailscale.com/download)
#           Then sign in (it'll open a browser).
#   phone:  Tailscale app from App Store / Play Store, sign into the same account.
#
# Run in PowerShell:
#   & "C:\Program Files\Git\bin\bash.exe" .\scripts\start-tailscale-dev.sh
#   & "C:\Program Files\Git\bin\bash.exe" .\scripts\start-tailscale-dev.sh 8090
#
# Run in Git Bash:
#   ./scripts/start-tailscale-dev.sh             # default port 8090
#   ./scripts/start-tailscale-dev.sh 8095        # specific port
#
# If the phone can't connect after you see the QR, the Windows Firewall is
# almost certainly blocking inbound on the dev port. Run once in admin PS:
#   New-NetFirewallRule -DisplayName "Expo Metro (Tailscale dev)" \
#     -Direction Inbound -Protocol TCP -LocalPort 8090 -Action Allow
# (Adjust LocalPort if you use a different port.)

set -euo pipefail

cd "$(dirname "$0")/.."

# ---------- find tailscale CLI ----------------------------------------------
TS_BIN=""
if command -v tailscale >/dev/null 2>&1; then
  TS_BIN="tailscale"
else
  for cand in \
    "/c/Program Files/Tailscale/tailscale.exe" \
    "/c/Program Files (x86)/Tailscale/tailscale.exe"; do
    if [[ -x "$cand" ]]; then
      TS_BIN="$cand"
      break
    fi
  done
fi

if [[ -z "$TS_BIN" ]]; then
  cat <<'EOF' >&2
ERROR: tailscale CLI not found. Install it first:

  Laptop (admin PowerShell):
    winget install --id Tailscale.Tailscale
    # then launch Tailscale and sign in (browser will open)

  Phone:
    Install the Tailscale app from your app store and sign into the same account.

After both are connected, re-run this script.
EOF
  exit 1
fi

# ---------- get tailnet IPv4 ------------------------------------------------
# `tailscale ip -4` prints just the v4 address, one per line, no extra text.
TS_IP=$("$TS_BIN" ip -4 2>/dev/null | head -1 | tr -d '\r ' || true)

if [[ -z "$TS_IP" ]]; then
  cat <<'EOF' >&2
ERROR: tailscale is installed but this device has no tailnet IP. Sign in:

  tailscale up

(This opens a browser to authenticate. After that, re-run this script.)
EOF
  exit 1
fi

# ---------- port ------------------------------------------------------------
PORT="${1:-${PORT:-8090}}"

# ---------- launch Expo bound to the tailnet IP -----------------------------
# EXPO_PACKAGER_PROXY_URL  — what Metro advertises in its manifest. Phone
#                            uses this to load the JS bundle, so it MUST be
#                            reachable from the phone (i.e. the tailnet IP).
# REACT_NATIVE_PACKAGER_HOSTNAME — older RN flag, still respected by some
#                            paths. Set to the same value for safety.
# EXPO_NO_DEV_CLIENT=1     — keep us on Expo Go, never auto-launch dev client.
export EXPO_PACKAGER_PROXY_URL="http://$TS_IP:$PORT"
export REACT_NATIVE_PACKAGER_HOSTNAME="$TS_IP"
export EXPO_NO_DEV_CLIENT=1

echo "================================================"
echo "  Tailscale IP:  $TS_IP"
echo "  Metro port:    $PORT"
echo "  Phone (Expo):  exp://$TS_IP:$PORT"
echo "================================================"
echo ""
echo "Phone setup:"
echo "  1. Make sure Tailscale is ON on the phone (same account)."
echo "  2. Open Expo Go, scan the QR below, OR paste exp://$TS_IP:$PORT."
echo ""
echo "If it times out: Windows Firewall is probably blocking inbound on port $PORT."
echo "Run once in an admin PowerShell to allow it:"
echo "  New-NetFirewallRule -DisplayName 'Expo Metro (Tailscale dev)' \\"
echo "    -Direction Inbound -Protocol TCP -LocalPort $PORT -Action Allow"
echo ""

cd apps/mobile

# Flags:
#   --port "$PORT"  — Metro listens on this port on all interfaces.
#   --clear         — wipe Metro cache so transform output from another
#                     project can't leak in.
#   --go            — force Expo Go target.
exec npx expo start --port "$PORT" --clear --go
