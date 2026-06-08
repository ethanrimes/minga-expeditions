# Personal Azure subscription — setup & credentials guide

This document is for **you** (the subscription Owner) to run on your **personal
Visual Studio Enterprise subscription** (`9a04b64b-af19-4519-be50-56ec2acbd855`).
It explains, step by step, what to create and **exactly which credentials to hand
back to me** so I can finish deploying the Minga backend (storage/media, and
optionally the full auth+REST mesh) from this environment **without** an
interactive `az login`.

> **Why your personal sub?** The corporate `AIERP_DevPlayground_CorporateFunctions`
> sub is under a management group that forces storage accounts to disable
> shared‑key auth and public blob (`SafeSec-Strg-OptIn` policy). Your personal sub
> has **no such policy**, so it can host the Supabase‑compatible storage that the
> corporate sub blocks.

---

## 0. TL;DR — what I ultimately need from you

Paste these back to me (all are secrets → I store them in Key Vault / gitignored `.env`, never committed):

| # | Credential | Looks like | Used for |
|---|---|---|---|
| 1 | **Service principal** appId / password / tenant | 3 GUID‑ish strings | so I can run `az` against your sub from here (create/manage resources) |
| 2 | **Storage connection string** | `DefaultEndpointsProtocol=https;AccountName=…;AccountKey=…;EndpointSuffix=core.windows.net` | apps + storage‑api read/write blobs directly |
| 3 | **Subscription id** | `9a04b64b-…` | target for all commands |

That's the minimum. Everything below is how to produce them. **Option A (service
principal)** lets me do the *entire* setup myself — you only run a few login
commands. **Option B (you click‑set‑up, paste connection string)** means you do
the storage creation and I just wire the apps.

---

## Prerequisites (one time, on your machine)

1. Install Azure CLI: <https://aka.ms/installazurecliwindows>
2. Sign in and select your personal sub:
   ```powershell
   az login
   az account set --subscription "9a04b64b-af19-4519-be50-56ec2acbd855"
   az account show --query "{name:name,id:id,user:user.name}" -o jsonc
   ```
   Confirm it prints **Visual Studio Enterprise Subscription**.

---

## Option A — Service principal (recommended; I do all the work)

This creates a non‑interactive identity I can use from this environment. It is the
cleanest path: you run 4 commands, paste me 4 values, and I provision + wire
everything.

### A1. Create a resource group for Minga
```powershell
az group create --name rg-minga-personal --location eastus
```
> `eastus` ≈ 71 ms to Bogotá (vs ~136 ms on Supabase Oregon). Your sub has no
> region policy, so East US is fine here.

### A2. Create the service principal, scoped to that resource group
```powershell
az ad sp create-for-rbac `
  --name "minga-deployer" `
  --role "Contributor" `
  --scopes "/subscriptions/9a04b64b-af19-4519-be50-56ec2acbd855/resourceGroups/rg-minga-personal"
```
This prints **exactly** what I need:
```json
{
  "appId":       "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",   ← clientId
  "displayName": "minga-deployer",
  "password":    "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",       ← clientSecret (shown ONCE)
  "tenant":      "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"     ← tenantId
}
```
> ⚠️ The `password` is shown **only once**. Copy all three now.

### A3. (Only if I'll also manage data‑plane via Entra) add a storage data role
The Contributor role above lets me *create* resources. If you also want me to
read/write blobs via Entra (not just the connection string), add:
```powershell
az role assignment create `
  --assignee "<appId from A2>" `
  --role "Storage Blob Data Contributor" `
  --scope "/subscriptions/9a04b64b-af19-4519-be50-56ec2acbd855/resourceGroups/rg-minga-personal"
```
(Optional — the connection string in Option B already covers data access.)

### A4. Give me these four values
```
SUBSCRIPTION_ID = 9a04b64b-af19-4519-be50-56ec2acbd855
ARM_CLIENT_ID   = <appId>
ARM_CLIENT_SECRET = <password>
ARM_TENANT_ID   = <tenant>
```
With these I run, from here:
```powershell
az login --service-principal -u $ARM_CLIENT_ID -p $ARM_CLIENT_SECRET --tenant $ARM_TENANT_ID
az account set --subscription $SUBSCRIPTION_ID
```
…and then create the storage account, containers, CDN, and (optionally) the
Container Apps auth/REST mesh — no interactive login needed.

---

## Option B — You set up storage, paste me the connection string

If you'd rather not create a service principal, do the storage setup yourself and
hand me just the connection string. I'll wire the apps to it.

### B1. Create a storage account (shared key + public blob ALLOWED on your sub)
```powershell
az group create --name rg-minga-personal --location eastus

az storage account create `
  --name mingapersonalst01 `              # must be globally unique, 3–24 lowercase/digits
  --resource-group rg-minga-personal `
  --location eastus `
  --sku Standard_LRS --kind StorageV2 `
  --allow-shared-key-access true `        # the corporate sub forbids this; yours allows it
  --allow-blob-public-access true `
  --min-tls-version TLS1_2
```

### B2. Create the three containers (mirror the Supabase buckets)
```powershell
$ctx = az storage account show-connection-string -g rg-minga-personal -n mingapersonalst01 --query connectionString -o tsv
foreach ($c in "activity-photos","avatars","expedition-photos") {
  az storage container create --name $c --connection-string $ctx --public-access blob
}
```
> `--public-access blob` makes media publicly readable by URL (what the apps and a
> CDN expect). Drop it and use SAS tokens instead if you want scoped/expiring URLs.

### B3. Grab the connection string and give it to me
```powershell
az storage account show-connection-string -g rg-minga-personal -n mingapersonalst01 --query connectionString -o tsv
```
Paste me that whole string (it contains the account key). Also tell me the
**account name** (`mingapersonalst01`) and which **region** you used.

---

## Optional — CDN in front of the media (recommended for the mobile apps)

Lower latency + caching for photos in Colombia. After the storage account exists:
```powershell
az afd profile create -g rg-minga-personal --profile-name minga-cdn --sku Standard_AzureFrontDoor
# (I can do this step for you under Option A; endpoint + origin wiring is fiddly.)
```
If you'd rather, just give me the storage credentials and I'll stand up the CDN.

---

## Optional — full auth + REST on your personal sub (not just storage)

If you want the **entire** backend (not only media) on your personal sub — i.e.
GoTrue (auth) + PostgREST + Realtime + Kong on Azure Container Apps — I need
**Option A** (service principal), because that requires creating many resources.
Steps I'd run for you with the SP:
1. Register providers: `Microsoft.App`, `Microsoft.OperationalInsights`.
2. Create a Container Apps environment in `eastus`.
3. Deploy GoTrue, PostgREST, Realtime, Kong (images pull secrets from a Key Vault
   I create on your sub).
4. Point `BACKEND_AZURE_SUPABASE_URL` at the Kong public URL and run
   `npm run backend:azure`.

> Note: the Postgres database itself is currently on the corporate sub (West US 2,
> the only region its policy allowed). I can either (a) keep Postgres there and run
> auth/REST/storage on your personal sub, or (b) recreate Postgres on your personal
> sub in East US for lower latency + single‑sub simplicity. Tell me which; (b) is
> cleaner long‑term and your sub allows East US.

---

## Key Vault access — there is NO keyless path

Unlike **Storage** (which on your personal sub can use a shared key / connection
string with no login), **Azure Key Vault is always Entra‑token‑gated.** There is no
anonymous, shared‑key, or connection‑string way to read a secret. So for me to read
secrets from your `ekallett@gmail.com` vault, exactly one of these must be true:

1. **You `az login` here** and I run under your token (requires your MFA — see below), **or**
2. **Service principal (Option A)** + grant it `Key Vault Secrets User` on the vault:
   ```powershell
   az role assignment create --assignee <appId> `
     --role "Key Vault Secrets User" `
     --scope $(az keyvault show -n <your-vault-name> --query id -o tsv)
   ```
   SPs are **not** subject to interactive‑MFA Conditional Access, so this is the
   reliable hands‑off path. **or**
3. **You read the secrets yourself** and paste the values — then I never touch the vault.

---

## Troubleshooting `az login` — `AADSTS50076` (MFA required)

Symptom:
```
AADSTS50076: ... you must use multi-factor authentication to access
'797f4846-ba00-4fd7-ba43-dac1f8f63013' ... Status_InteractionRequired
No subscriptions found for ekallett@gmail.com.
```

**This is NOT a VPN/firewall problem.** Network issues throw connection/TLS errors,
not `AADSTS…`. `797f4846-ba00-4fd7-ba43-dac1f8f63013` is the **Azure Management API**,
and your tenant has a **Conditional Access policy that requires MFA**. The silent
token grab didn't satisfy it, so subscription enumeration was blocked.

**Fix — force an interactive MFA login against the specific tenant:**
```powershell
az logout
az account clear
az login --tenant 148ba320-1a6d-4fd7-ba8b-2897083e7531
```
Complete the MFA challenge in the browser.

**If the browser won't open (headless/SSH):** device‑code flow
```powershell
az login --use-device-code --tenant 148ba320-1a6d-4fd7-ba8b-2897083e7531
```

**If it logs in but still says "no subscriptions":** the sub may live in a different
tenant. Enumerate everything your account can see:
```powershell
az account list --all -o table
az account tenant list -o table
```
Then log in against the tenant that actually owns sub `9a04b64b-af19-4519-be50-56ec2acbd855`:
```powershell
az login --tenant <that-tenant-id>
az account set --subscription 9a04b64b-af19-4519-be50-56ec2acbd855
az account show -o jsonc
```

**If MFA itself can't complete (no second factor enrolled):** register one at
<https://aka.ms/mfasetup>, then retry `az login --tenant …`.

> Once `az account show` succeeds, the cleanest hand‑off is still **Option A**: create
> the `minga-deployer` SP, grant it `Key Vault Secrets User` (above) + `Contributor`,
> and paste me appId/password/tenant. After that I operate non‑interactively with no
> further MFA prompts.

---

## Security notes (please read)

- **Everything you paste is a bearer secret.** A connection string or SP password
  grants real access. I put them only in **Azure Key Vault** and the **gitignored
  `.env`** — never in committed files, never in memory/logs.
- **Service principal is scoped** to `rg-minga-personal` only (least privilege) — it
  cannot touch the rest of your subscription.
- **Rotate/revoke anytime:**
  - SP secret: `az ad sp credential reset --id <appId>` (new password) or
    `az ad app delete --id <appId>` (kill it entirely).
  - Storage key: `az storage account keys renew -g rg-minga-personal -n <acct> --key primary`.
- **Spending:** your sub has a spending cap **On**. A Standard_LRS storage account +
  Front Door Standard is a few dollars/month; Container Apps scale‑to‑zero is near‑$0
  idle. Nothing here risks a surprise bill, but the cap protects you regardless.

---

## What happens after you give me the credentials

1. I create / verify the storage account + 3 containers (+ CDN if requested).
2. I migrate existing media from Supabase storage into the Azure containers
   (one‑time copy; Supabase keeps its copy — nothing deleted).
3. I store the connection string + keys in Key Vault and fill `BACKEND_AZURE_*` in
   `.env`.
4. I wire the apps' storage calls (and, if chosen, the auth/REST mesh) to Azure and
   run `npm run backend:azure`.
5. You can roll back to Supabase at any time with `npm run backend:supabase` — your
   Supabase project is never modified or deleted.

---

### Quick reference — the single block to paste back to me

```
SUBSCRIPTION_ID   = 9a04b64b-af19-4519-be50-56ec2acbd855
# Option A (preferred):
ARM_CLIENT_ID     = <appId from `az ad sp create-for-rbac`>
ARM_CLIENT_SECRET = <password from same command>
ARM_TENANT_ID     = <tenant from same command>
# Option B (storage only):
STORAGE_ACCOUNT   = <name you chose>
STORAGE_CONNECTION_STRING = <output of show-connection-string>
REGION            = eastus
```
