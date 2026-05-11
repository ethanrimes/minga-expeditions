// Verifies a 6-digit code against the most recent phone_verifications row
// for the calling user. On success: writes phone_country_code,
// phone_number, and phone_verified_at on the user's profile, and deletes
// the verification row(s) for that phone.
//
// Auth model matches whatsapp-otp-send — extracts the user from the
// Authorization JWT. Deploy with --no-verify-jwt so we own the auth path.
//
// Request body:
//   { phone_e164: '+573001234567', code: '123456' }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MAX_ATTEMPTS = 5;

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return json({ error: 'Sign in required.' }, 401);
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userResp } = await supabase.auth.getUser(authHeader.slice(7));
  const user = userResp.user;
  if (!user) return json({ error: 'Sign in required.' }, 401);

  let body: { phone_e164?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }
  const phone = (body.phone_e164 ?? '').trim();
  const code = (body.code ?? '').trim();
  if (!phone || !code) return json({ error: 'phone_e164 and code are required.' }, 400);
  if (!/^\d{4,8}$/.test(code)) return json({ error: 'Code must be 4–8 digits.' }, 400);

  // Most recent unexpired row first. We don't pre-filter by expired so we can
  // give a friendlier "code expired" error vs a generic "not found".
  const { data: rows, error: fetchErr } = await supabase
    .from('phone_verifications')
    .select('id, code_hash, expires_at, attempts')
    .eq('user_id', user.id)
    .eq('phone_e164', phone)
    .order('created_at', { ascending: false })
    .limit(1);
  if (fetchErr) return json({ error: `db error: ${fetchErr.message}` }, 500);
  if (!rows || rows.length === 0) {
    return json({ error: 'No verification in progress for this number. Request a new code.' }, 400);
  }
  const row = rows[0];

  if (new Date(row.expires_at) < new Date()) {
    return json({ error: 'Code expired. Request a new code.' }, 400);
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return json({ error: 'Too many failed attempts. Request a new code.' }, 429);
  }

  // Burn an attempt up front so brute-forcing the hash counts even on errors.
  await supabase
    .from('phone_verifications')
    .update({ attempts: row.attempts + 1 })
    .eq('id', row.id);

  const expectedHash = await sha256Hex(code);
  if (expectedHash !== row.code_hash) {
    return json({
      error: 'Wrong code.',
      attempts_remaining: Math.max(0, MAX_ATTEMPTS - (row.attempts + 1)),
    }, 400);
  }

  // Split the verified E.164 into country code + national number, mirroring
  // the rest of the app's storage model.
  const m = phone.match(/^\+(\d{1,3})(.+)$/);
  if (!m) return json({ error: 'Could not parse verified phone.' }, 500);
  const phoneCountryCode = `+${m[1]}`;
  const phoneNumber = m[2];

  const verifiedAt = new Date().toISOString();
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({
      phone_country_code: phoneCountryCode,
      phone_number: phoneNumber,
      phone_verified_at: verifiedAt,
    })
    .eq('id', user.id);
  if (updateErr) return json({ error: `profile update failed: ${updateErr.message}` }, 500);

  // Burn all verification rows for this user/phone — leave no residue.
  await supabase
    .from('phone_verifications')
    .delete()
    .eq('user_id', user.id)
    .eq('phone_e164', phone);

  return json({
    ok: true,
    phone_country_code: phoneCountryCode,
    phone_number: phoneNumber,
    phone_verified_at: verifiedAt,
  });
});
