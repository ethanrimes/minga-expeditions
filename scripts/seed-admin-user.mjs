#!/usr/bin/env node
// Creates (or refreshes) a demo admin user for the admin website. Idempotent.
//
// Requires:
//   SUPABASE_URL                 e.g. https://<your-project>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY    legacy JWT service-role key
//   SUPABASE_DB_URL              session-pooler URL for DML
//   ADMIN_DEMO_EMAIL  (optional, default admin-demo@minga.co)
//   ADMIN_DEMO_PASSWORD (optional, default MingaAdminDemo2026!)
//
// Usage:
//   node --env-file=.env scripts/seed-admin-user.mjs

import pg from 'pg';

const EMAIL = process.env.ADMIN_DEMO_EMAIL ?? 'admin-demo@minga.co';
const PASSWORD = process.env.ADMIN_DEMO_PASSWORD ?? 'MingaAdminDemo2026!';
const DISPLAY_NAME = 'Admin Demo';
const USERNAME = 'admin.demo';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.SUPABASE_DB_URL;

if (!url || !serviceKey || !dbUrl) {
  console.error('✘ Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_DB_URL.');
  process.exit(1);
}

async function adminFetch(path, init = {}) {
  const res = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`${path} → ${res.status} ${body.slice(0, 400)}`);
  return body ? JSON.parse(body) : null;
}

async function findUserIdByEmail(email) {
  const data = await adminFetch(`/auth/v1/admin/users?email=${encodeURIComponent(email)}`);
  const users = data?.users ?? [];
  return users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
}

async function ensureUser() {
  const existing = await findUserIdByEmail(EMAIL);
  if (existing) {
    console.log(`▶ auth user already exists (${EMAIL} → ${existing}), refreshing password`);
    await adminFetch(`/auth/v1/admin/users/${existing}`, {
      method: 'PUT',
      body: JSON.stringify({
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: DISPLAY_NAME, username: USERNAME },
      }),
    });
    return existing;
  }
  console.log(`▶ creating auth user ${EMAIL}`);
  const created = await adminFetch('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: DISPLAY_NAME, username: USERNAME },
    }),
  });
  return created?.id ?? (await findUserIdByEmail(EMAIL));
}

async function main() {
  const userId = await ensureUser();
  if (!userId) throw new Error('could not resolve admin user id');
  console.log(`▶ admin user id = ${userId}`);

  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(
      `insert into public.profiles (id, username, display_name, role)
       values ($1, $2, $3, 'admin')
       on conflict (id) do update set
         display_name = excluded.display_name,
         username     = excluded.username,
         role         = 'admin'`,
      [userId, USERNAME, DISPLAY_NAME],
    );
    console.log('✔ profile upserted with role=admin');
  } finally {
    await client.end().catch(() => {});
  }

  console.log('');
  console.log('================================================');
  console.log('  Admin demo login');
  console.log('  Email:    ' + EMAIL);
  console.log('  Password: ' + PASSWORD);
  console.log('================================================');
}

main().catch((e) => {
  console.error('✘ seed failed:', e);
  process.exit(1);
});
