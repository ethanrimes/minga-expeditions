#!/usr/bin/env bash
# start-lan-dev.sh — Run Expo bound to your laptop's LAN IP so a phone on
#                    the same network connects directly. No tunnel, no
#                    third-party agent.
#
# This script auto-detects the active "default-route" adapter, so the SAME
# script works for any of these LAN modes without modification:
#   • Home / office Wi-Fi (laptop and phone on same SSID, no AP isolation)
#   • iPhone Personal Hotspot via Wi-Fi (laptop joins phone's hotspot SSID)
#   • iPhone Personal Hotspot via USB cable (laptop tethers to phone — phone
#     shows up as a network adapter, both share 172.20.10.x subnet)
#
# When in doubt: USB-tether to your iPhone with Personal Hotspot on. That
# bypasses every Wi-Fi-related failure mode (AP isolation, corp filtering,
# weird router configs) and works inside any building.
#
# Run in PowerShell:
#   & "C:\Program Files\Git\bin\bash.exe" .\scripts\start-lan-dev.sh
#   & "C:\Program Files\Git\bin\bash.exe" .\scripts\start-lan-dev.sh 8090
#
# Run in Git Bash:
#   ./scripts/start-lan-dev.sh             # default port 8090
#   ./scripts/start-lan-dev.sh 8095        # specific port
#
# How to test from your phone after Metro starts:
#   1. Phone Safari → http://<LAN-IP>:<PORT>/status
#      Expect: plain text "packager-status:running"
#      → If you see that, the path is open. Open Expo Go and scan the QR.
#      → If it times out, see "If the phone times out" at the end of this header.
#
# If the phone times out:
#   The Windows Firewall is blocking inbound on the dev port. Run once in an
#   admin PowerShell to allow it (replace 8090 if you use a different port):
#     New-NetFirewallRule -DisplayName "Expo Metro (LAN dev)" \
#       -Direction Inbound -Protocol TCP -LocalPort 8090 -Action Allow
#
#   If it STILL times out after the firewall rule, your Wi-Fi has client
#   isolation enabled (corp/guest networks usually do). Switch to iPhone
#   Personal Hotspot — connect the laptop to the phone's hotspot and re-run.

set -euo pipefail

cd "$(dirname "$0")/.."

# ---------- detect the LAN adapter we should bind to ------------------------
# We pick whichever adapter is currently carrying the default route — that's
# the one with internet, which is also the one your phone will be on whether
# it's home Wi-Fi, an iPhone hotspot, or a USB tether. The lowest-metric
# default route wins (Windows prefers the cheapest path).
#
# Returns "<adapter-alias>|<ipv4>" on success, empty string on failure.
detect_active_adapter() {
  powershell.exe -NoProfile -Command "
    \$route = Get-NetRoute -AddressFamily IPv4 -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue |
      Sort-Object -Property RouteMetric, InterfaceMetric |
      Select-Object -First 1
    if (\$route) {
      \$alias = (Get-NetAdapter -InterfaceIndex \$route.ifIndex).Name
      \$ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex \$route.ifIndex |
              Where-Object { \$_.IPAddress -notlike '169.254.*' } |
              Select-Object -First 1).IPAddress
      if (\$alias -and \$ip) { '{0}|{1}' -f \$alias, \$ip }
    }
  " 2>/dev/null | tr -d '\r\n '
}

DETECTED=$(detect_active_adapter)
if [[ -z "$DETECTED" ]]; then
  cat <<'EOF' >&2
ERROR: couldn't find an active default-route adapter with an IPv4 address.
You're probably offline. To debug, run in PowerShell:
  Get-NetRoute -AddressFamily IPv4 -DestinationPrefix '0.0.0.0/0'
  Get-NetIPAddress -AddressFamily IPv4 | Format-Table InterfaceAlias, IPAddress
EOF
  exit 1
fi

ADAPTER="${DETECTED%%|*}"
LAN_IP="${DETECTED##*|}"

# ---------- port ------------------------------------------------------------
PORT="${1:-${PORT:-8090}}"

# ---------- launch Expo bound to the LAN IP ---------------------------------
# EXPO_PACKAGER_PROXY_URL  — what Metro advertises in the manifest. The
#                            phone uses this to fetch the JS bundle, so it
#                            must be reachable from the phone (the LAN IP).
# REACT_NATIVE_PACKAGER_HOSTNAME — older RN flag; some paths still respect
#                                  it. Set to the same value for safety.
# EXPO_NO_DEV_CLIENT=1     — keep us on Expo Go, never auto-launch dev client.
export EXPO_PACKAGER_PROXY_URL="http://$LAN_IP:$PORT"
export REACT_NATIVE_PACKAGER_HOSTNAME="$LAN_IP"
export EXPO_NO_DEV_CLIENT=1

echo "================================================"
echo "  Adapter:       $ADAPTER"
echo "  LAN IP:        $LAN_IP"
echo "  Metro port:    $PORT"
echo "  Phone (Expo):  exp://$LAN_IP:$PORT"
echo "  Sanity test:   http://$LAN_IP:$PORT/status  (open in phone Safari)"
echo "================================================"
echo ""
echo "Phone setup:"
echo "  1. Make sure your phone is on the same Wi-Fi as this laptop."
echo "  2. In Safari on your phone, open: http://$LAN_IP:$PORT/status"
echo "     Expect: 'packager-status:running'"
echo "  3. Then open Expo Go and scan the QR below (or paste exp://$LAN_IP:$PORT)."
echo ""
echo "If step 2 times out, Windows Firewall is blocking the port. In an"
echo "admin PowerShell, run once:"
echo "  New-NetFirewallRule -DisplayName 'Expo Metro (LAN dev)' \\"
echo "    -Direction Inbound -Protocol TCP -LocalPort $PORT -Action Allow"
echo ""

cd apps/mobile

# Flags:
#   --port "$PORT"  — Metro listens on this port on all interfaces.
#   --clear         — wipe Metro cache to avoid stale transform output.
#   --go            — force Expo Go target (not a custom dev client).
#   --lan           — Expo's built-in LAN mode; QR encodes the LAN URL.
exec npx expo start --port "$PORT" --clear --go --lan
