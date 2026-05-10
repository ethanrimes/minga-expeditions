#!/usr/bin/env bash
# start-ngrok-dev.sh — Run Expo with its built-in ngrok tunnel. Useful when:
#   • You can't be on the same network as your phone (different city,
#     different building) so LAN won't work.
#   • Cloudflared (start-tunnel-dev.sh) failed but you want to A/B test
#     a different tunnel edge before giving up on tunnels entirely.
#
# Tunnels are slower and more fragile than LAN. Use start-lan-dev.sh first
# whenever you can be on the same Wi-Fi or USB-tether to your phone.
#
# Run in PowerShell:
#   & "C:\Program Files\Git\bin\bash.exe" .\scripts\start-ngrok-dev.sh
#   & "C:\Program Files\Git\bin\bash.exe" .\scripts\start-ngrok-dev.sh 8090
#
# Run in Git Bash:
#   ./scripts/start-ngrok-dev.sh             # default port 8090
#   ./scripts/start-ngrok-dev.sh 8095        # specific port
#
# Requires: @expo/ngrok dev dep installed (already done in apps/mobile).

set -euo pipefail

cd "$(dirname "$0")/.."

PORT="${1:-${PORT:-8090}}"

cd apps/mobile

export EXPO_NO_DEV_CLIENT=1

echo "================================================"
echo "  Mode:          ngrok tunnel (Expo built-in)"
echo "  Metro port:    $PORT"
echo "================================================"
echo ""
echo "Expo will print a tunnel URL once ngrok connects. Open Expo Go and"
echo "scan the QR. If the QR doesn't render, paste the exp:// URL it prints."
echo ""

# Flags:
#   --port    — Metro listens here.
#   --clear   — wipe Metro cache.
#   --go      — force Expo Go target.
#   --tunnel  — Expo's built-in tunnel mode (uses @expo/ngrok).
exec npx expo start --port "$PORT" --clear --go --tunnel
