<#
.SYNOPSIS
  Provisions the Minga "self-hosted Supabase on Azure" backend foundation:
  Resource Group + Postgres Flexible Server (+ firewall, db, extensions) +
  Supabase-compat schema (bootstrap + repo migrations + grants) +
  Blob Storage (3 buckets) + Key Vault (DB + JWT secrets).

  Everything here was first done live against the AIERP dev playground; this
  script makes it reproducible and, crucially, *subscription-swappable* for a
  production subscription via -SubscriptionId.

.NOTES
  - Supabase is never touched by this script. The app keeps talking to whatever
    `npm run backend:<name>` selected; this only stands up the Azure side.
  - AIERP policy notes (dev sub 5423a68c-...):
      * Postgres Flexible Server is region-restricted -> only `westus2` is
        accepted (eastus/eastus2/centralus/southcentralus are denied by policy).
      * Storage accounts must disable shared-key auth (Entra-ID/RBAC only) and
        cannot enable public blob access. Public read is served via CDN/SAS.
    A clean production subscription typically lifts both, so the defaults are
    overridable.
  - Requires: az CLI (logged in), Node.js (for scripts/run-sql.mjs +
    scripts/gen-jwt-keys.mjs), and the repo `pg` devDependency installed.

.EXAMPLE
  # Dev (AIERP), reuse existing names:
  ./infra/azure/deploy.ps1

.EXAMPLE
  # Production on a different subscription + region:
  ./infra/azure/deploy.ps1 -SubscriptionId <prod-sub-guid> -Location eastus `
      -ResourceGroup rg-minga-prod -NameSuffix prod01 -SkipSql:$false
#>
[CmdletBinding()]
param(
  [string] $SubscriptionId = '5423a68c-2f22-4512-a82c-eb6ed44d9aaf', # AIERP_DevPlayground_CorporateFunctions
  [string] $Location       = 'westus2',            # only region accepted for Postgres on AIERP
  [string] $RgLocation     = 'eastus',             # RG-location policy differs from resource-location policy
  [string] $ResourceGroup  = 'rg-minga-dev-eastus',
  [string] $NameSuffix     = '1db10c',             # appended to globally-unique resource names
  [string] $AdminUser      = 'mingaadmin',
  [string] $AdminPassword,                          # generated if omitted
  [string] $DatabaseName   = 'minga',
  [string] $PgSku          = 'Standard_B2s',
  [string] $PgTier         = 'Burstable',
  [string] $PgVersion      = '16',
  [switch] $SkipSql,                                # skip applying bootstrap+migrations+grants
  [string] $OutFile        = "$env:TEMP\minga-azure.json"
)

$ErrorActionPreference = 'Stop'
function Find-Az {
  $c = Get-Command az -ErrorAction SilentlyContinue
  if ($c) { return $c.Source }
  $p = 'C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd'
  if (Test-Path $p) { return $p }
  throw 'az CLI not found on PATH.'
}
$az = Find-Az
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Write-Host "==> repo root: $repoRoot"

# --- names -----------------------------------------------------------------
$server  = "minga-pg-dev-$NameSuffix"
$storage = ("mingadevst$NameSuffix" -replace '[^a-z0-9]', '').ToLower()
if ($storage.Length -gt 24) { $storage = $storage.Substring(0, 24) }
$kv      = "minga-kv-$NameSuffix"
if (-not $AdminPassword) {
  $AdminPassword = 'Mg!' + ([guid]::NewGuid().ToString('N').Substring(0, 16)) + 'aZ9'
}

Write-Host "==> subscription: $SubscriptionId"
& $az account set --subscription $SubscriptionId
& $az account show --query "{name:name,id:id}" -o jsonc

# --- resource group --------------------------------------------------------
Write-Host "==> resource group $ResourceGroup ($RgLocation)"
& $az group create --name $ResourceGroup --location $RgLocation -o none

# --- postgres flexible server ----------------------------------------------
$exists = & $az postgres flexible-server show -g $ResourceGroup -n $server --query name -o tsv 2>$null
if (-not $exists) {
  Write-Host "==> creating Postgres Flexible Server $server ($Location, $PgTier/$PgSku, PG$PgVersion)"
  & $az postgres flexible-server create `
      --resource-group $ResourceGroup --name $server --location $Location `
      --admin-user $AdminUser --admin-password $AdminPassword `
      --tier $PgTier --sku-name $PgSku --version $PgVersion `
      --storage-size 32 --public-access None -o none
} else {
  Write-Host "==> Postgres server $server already exists; skipping create"
}

Write-Host "==> firewall AllowAllDev (dev only; lock down for prod)"
& $az postgres flexible-server firewall-rule create -g $ResourceGroup -n $server `
    --rule-name AllowAllDev --start-ip-address 0.0.0.0 --end-ip-address 255.255.255.255 -o none

Write-Host "==> database $DatabaseName"
& $az postgres flexible-server db create -g $ResourceGroup -s $server -d $DatabaseName -o none 2>$null

Write-Host "==> azure.extensions = POSTGIS,PGCRYPTO,UUID-OSSP"
& $az postgres flexible-server parameter set -g $ResourceGroup -s $server `
    --name azure.extensions --value POSTGIS,PGCRYPTO,UUID-OSSP -o none
Write-Host "==> restart to apply extension allow-list"
& $az postgres flexible-server restart -g $ResourceGroup -n $server -o none

$fqdn  = "$server.postgres.database.azure.com"
$encPw = [uri]::EscapeDataString($AdminPassword)
$dbUrl = "postgresql://$AdminUser`:$encPw@$fqdn`:5432/$DatabaseName"

# --- schema (bootstrap + migrations + grants) ------------------------------
if (-not $SkipSql) {
  Write-Host "==> applying Supabase-compat schema to $fqdn/$DatabaseName"
  $files = @("$PSScriptRoot\sql\00_supabase_bootstrap.sql")
  $files += (Get-ChildItem "$repoRoot\supabase\migrations\*.sql" | Sort-Object Name | ForEach-Object FullName)
  $files += "$PSScriptRoot\sql\99_grants.sql"
  $env:SUPABASE_DB_URL = $dbUrl
  Push-Location $repoRoot
  try { node scripts/run-sql.mjs @files } finally { Pop-Location }
  if ($LASTEXITCODE -ne 0) { throw "schema apply failed (exit $LASTEXITCODE)" }
} else {
  Write-Host "==> -SkipSql set; not applying schema"
}

# --- storage account + buckets ---------------------------------------------
$saExists = & $az storage account show -g $ResourceGroup -n $storage --query name -o tsv 2>$null
if (-not $saExists) {
  Write-Host "==> creating storage account $storage (Entra-only, no public blob)"
  & $az storage account create --name $storage --resource-group $ResourceGroup --location $Location `
      --sku Standard_LRS --kind StorageV2 `
      --allow-shared-key-access false --allow-blob-public-access false --min-tls-version TLS1_2 -o none
} else {
  Write-Host "==> storage account $storage already exists; skipping create"
}

$me = & $az ad signed-in-user show --query id -o tsv
$saScope = "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup/providers/Microsoft.Storage/storageAccounts/$storage"
Write-Host "==> granting caller Storage Blob Data Contributor"
& $az role assignment create --assignee-object-id $me --assignee-principal-type User `
    --role "Storage Blob Data Contributor" --scope $saScope -o none 2>$null
Start-Sleep -Seconds 30  # RBAC propagation
foreach ($c in @('activity-photos', 'avatars', 'expedition-photos')) {
  & $az storage container create --name $c --account-name $storage --auth-mode login -o none 2>$null
  Write-Host "    container $c"
}

# --- key vault + secrets ---------------------------------------------------
$kvExists = & $az keyvault show -n $kv --query name -o tsv 2>$null
if (-not $kvExists) {
  Write-Host "==> creating Key Vault $kv (RBAC)"
  & $az keyvault create --name $kv --resource-group $ResourceGroup --location $Location `
      --enable-rbac-authorization true -o none
} else {
  Write-Host "==> Key Vault $kv already exists; skipping create"
}
$kvScope = "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup/providers/Microsoft.KeyVault/vaults/$kv"
Write-Host "==> granting caller Key Vault Secrets Officer"
& $az role assignment create --assignee-object-id $me --assignee-principal-type User `
    --role "Key Vault Secrets Officer" --scope $kvScope -o none 2>$null
Start-Sleep -Seconds 30  # RBAC propagation

Write-Host "==> generating Supabase-compatible JWT secret + anon/service keys"
$keys = node "$repoRoot\scripts\gen-jwt-keys.mjs" | ConvertFrom-Json

# --value=... (equals form) so leading-dash base64url values aren't parsed as flags.
& $az keyvault secret set --vault-name $kv --name pg-admin-user     --value="$AdminUser" -o none
& $az keyvault secret set --vault-name $kv --name pg-admin-password --value="$AdminPassword" -o none
& $az keyvault secret set --vault-name $kv --name pg-host           --value="$fqdn" -o none
& $az keyvault secret set --vault-name $kv --name database-url      --value="$dbUrl`?sslmode=require" -o none
& $az keyvault secret set --vault-name $kv --name jwt-secret        --value="$($keys.jwtSecret)" -o none
& $az keyvault secret set --vault-name $kv --name anon-key          --value="$($keys.anon)" -o none
& $az keyvault secret set --vault-name $kv --name service-role-key  --value="$($keys.service)" -o none

# --- summary ---------------------------------------------------------------
$out = [ordered]@{
  subscriptionId = $SubscriptionId
  rg             = $ResourceGroup
  loc            = $Location
  server         = $server
  database       = $DatabaseName
  admin          = $AdminUser
  password       = $AdminPassword
  storageAccount = $storage
  keyVault       = $kv
  containers     = @('activity-photos', 'avatars', 'expedition-photos')
}
$out | ConvertTo-Json | Set-Content $OutFile
Write-Host ""
Write-Host "==> DONE. Metadata written to $OutFile"
Write-Host "    Postgres : $fqdn"
Write-Host "    Storage  : $storage (containers: activity-photos, avatars, expedition-photos)"
Write-Host "    KeyVault : $kv (secrets: anon-key, service-role-key, jwt-secret, database-url, pg-*)"
Write-Host ""
Write-Host "Next: stand up GoTrue/PostgREST/Storage/Realtime/Kong on Container Apps"
Write-Host "      (see infra/azure/README.md), then fill BACKEND_AZURE_* in .env and run"
Write-Host "      'npm run backend:azure'. Rollback anytime with 'npm run backend:supabase'."
