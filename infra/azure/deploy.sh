#!/usr/bin/env bash
# Bash port of deploy.ps1 — provisions the Minga self-hosted-Supabase-on-Azure
# foundation (RG + Postgres Flexible Server + schema + Blob Storage + Key Vault).
# Subscription-swappable for production via --subscription-id.
#
# Supabase is never touched. See infra/azure/README.md for the service layer
# (GoTrue/PostgREST/Storage/Realtime/Kong) and cutover/rollback.
#
# Requires: az CLI (logged in), node (scripts/run-sql.mjs + gen-jwt-keys.mjs),
# and the repo `pg` devDependency installed.
set -euo pipefail

SUBSCRIPTION_ID="5423a68c-2f22-4512-a82c-eb6ed44d9aaf"  # AIERP dev playground
LOCATION="westus2"          # only region accepted for Postgres on AIERP
RG_LOCATION="eastus"        # RG-location policy differs from resource-location policy
RESOURCE_GROUP="rg-minga-dev-eastus"
NAME_SUFFIX="1db10c"
ADMIN_USER="mingaadmin"
ADMIN_PASSWORD=""
DATABASE_NAME="minga"
PG_SKU="Standard_B2s"; PG_TIER="Burstable"; PG_VERSION="16"
SKIP_SQL="false"
OUT_FILE="${TMPDIR:-/tmp}/minga-azure.json"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --subscription-id) SUBSCRIPTION_ID="$2"; shift 2;;
    --location)        LOCATION="$2"; shift 2;;
    --rg-location)     RG_LOCATION="$2"; shift 2;;
    --resource-group)  RESOURCE_GROUP="$2"; shift 2;;
    --name-suffix)     NAME_SUFFIX="$2"; shift 2;;
    --admin-user)      ADMIN_USER="$2"; shift 2;;
    --admin-password)  ADMIN_PASSWORD="$2"; shift 2;;
    --database-name)   DATABASE_NAME="$2"; shift 2;;
    --skip-sql)        SKIP_SQL="true"; shift;;
    *) echo "unknown arg: $1" >&2; exit 2;;
  esac
done

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER="minga-pg-dev-${NAME_SUFFIX}"
STORAGE="$(echo "mingadevst${NAME_SUFFIX}" | tr -cd 'a-z0-9' | cut -c1-24)"
KV="minga-kv-${NAME_SUFFIX}"
[[ -z "$ADMIN_PASSWORD" ]] && ADMIN_PASSWORD="Mg!$(openssl rand -hex 8)aZ9"

echo "==> subscription: $SUBSCRIPTION_ID"
az account set --subscription "$SUBSCRIPTION_ID"

echo "==> resource group $RESOURCE_GROUP ($RG_LOCATION)"
az group create --name "$RESOURCE_GROUP" --location "$RG_LOCATION" -o none

if ! az postgres flexible-server show -g "$RESOURCE_GROUP" -n "$SERVER" -o none 2>/dev/null; then
  echo "==> creating Postgres Flexible Server $SERVER ($LOCATION, $PG_TIER/$PG_SKU, PG$PG_VERSION)"
  az postgres flexible-server create \
    --resource-group "$RESOURCE_GROUP" --name "$SERVER" --location "$LOCATION" \
    --admin-user "$ADMIN_USER" --admin-password "$ADMIN_PASSWORD" \
    --tier "$PG_TIER" --sku-name "$PG_SKU" --version "$PG_VERSION" \
    --storage-size 32 --public-access None -o none
fi

echo "==> firewall AllowAllDev (dev only; lock down for prod)"
az postgres flexible-server firewall-rule create -g "$RESOURCE_GROUP" -n "$SERVER" \
  --rule-name AllowAllDev --start-ip-address 0.0.0.0 --end-ip-address 255.255.255.255 -o none

echo "==> database $DATABASE_NAME"
az postgres flexible-server db create -g "$RESOURCE_GROUP" -s "$SERVER" -d "$DATABASE_NAME" -o none 2>/dev/null || true

echo "==> azure.extensions = POSTGIS,PGCRYPTO,UUID-OSSP"
az postgres flexible-server parameter set -g "$RESOURCE_GROUP" -s "$SERVER" \
  --name azure.extensions --value POSTGIS,PGCRYPTO,UUID-OSSP -o none
echo "==> restart to apply extension allow-list"
az postgres flexible-server restart -g "$RESOURCE_GROUP" -n "$SERVER" -o none

FQDN="${SERVER}.postgres.database.azure.com"
ENC_PW="$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$ADMIN_PASSWORD")"
DB_URL="postgresql://${ADMIN_USER}:${ENC_PW}@${FQDN}:5432/${DATABASE_NAME}"

if [[ "$SKIP_SQL" != "true" ]]; then
  echo "==> applying Supabase-compat schema to $FQDN/$DATABASE_NAME"
  mapfile -t MIGS < <(ls "$REPO_ROOT"/supabase/migrations/*.sql | sort)
  SUPABASE_DB_URL="$DB_URL" node "$REPO_ROOT/scripts/run-sql.mjs" \
    "$HERE/sql/00_supabase_bootstrap.sql" "${MIGS[@]}" "$HERE/sql/99_grants.sql"
fi

if ! az storage account show -g "$RESOURCE_GROUP" -n "$STORAGE" -o none 2>/dev/null; then
  echo "==> creating storage account $STORAGE (Entra-only, no public blob)"
  az storage account create --name "$STORAGE" --resource-group "$RESOURCE_GROUP" --location "$LOCATION" \
    --sku Standard_LRS --kind StorageV2 \
    --allow-shared-key-access false --allow-blob-public-access false --min-tls-version TLS1_2 -o none
fi

ME="$(az ad signed-in-user show --query id -o tsv)"
SA_SCOPE="/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.Storage/storageAccounts/${STORAGE}"
az role assignment create --assignee-object-id "$ME" --assignee-principal-type User \
  --role "Storage Blob Data Contributor" --scope "$SA_SCOPE" -o none 2>/dev/null || true
sleep 30
for c in activity-photos avatars expedition-photos; do
  az storage container create --name "$c" --account-name "$STORAGE" --auth-mode login -o none 2>/dev/null || true
  echo "    container $c"
done

if ! az keyvault show -n "$KV" -o none 2>/dev/null; then
  echo "==> creating Key Vault $KV (RBAC)"
  az keyvault create --name "$KV" --resource-group "$RESOURCE_GROUP" --location "$LOCATION" \
    --enable-rbac-authorization true -o none
fi
KV_SCOPE="/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.KeyVault/vaults/${KV}"
az role assignment create --assignee-object-id "$ME" --assignee-principal-type User \
  --role "Key Vault Secrets Officer" --scope "$KV_SCOPE" -o none 2>/dev/null || true
sleep 30

echo "==> generating Supabase-compatible JWT secret + anon/service keys"
KEYS_JSON="$(node "$REPO_ROOT/scripts/gen-jwt-keys.mjs")"
JWT_SECRET="$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).jwtSecret)' "$KEYS_JSON")"
ANON="$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).anon)' "$KEYS_JSON")"
SERVICE="$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).service)' "$KEYS_JSON")"

az keyvault secret set --vault-name "$KV" --name pg-admin-user     --value "$ADMIN_USER" -o none
az keyvault secret set --vault-name "$KV" --name pg-admin-password --value "$ADMIN_PASSWORD" -o none
az keyvault secret set --vault-name "$KV" --name pg-host           --value "$FQDN" -o none
az keyvault secret set --vault-name "$KV" --name database-url      --value "${DB_URL}?sslmode=require" -o none
az keyvault secret set --vault-name "$KV" --name jwt-secret        --value "$JWT_SECRET" -o none
az keyvault secret set --vault-name "$KV" --name anon-key          --value "$ANON" -o none
az keyvault secret set --vault-name "$KV" --name service-role-key  --value "$SERVICE" -o none

cat > "$OUT_FILE" <<JSON
{
  "subscriptionId": "$SUBSCRIPTION_ID",
  "rg": "$RESOURCE_GROUP",
  "loc": "$LOCATION",
  "server": "$SERVER",
  "database": "$DATABASE_NAME",
  "admin": "$ADMIN_USER",
  "storageAccount": "$STORAGE",
  "keyVault": "$KV",
  "containers": ["activity-photos", "avatars", "expedition-photos"]
}
JSON

echo ""
echo "==> DONE. Metadata written to $OUT_FILE"
echo "    Postgres : $FQDN"
echo "    Storage  : $STORAGE"
echo "    KeyVault : $KV"
echo ""
echo "Next: stand up GoTrue/PostgREST/Storage/Realtime/Kong (see infra/azure/README.md),"
echo "      fill BACKEND_AZURE_* in .env, then 'npm run backend:azure'. Rollback: 'npm run backend:supabase'."
