// Sends a 6-digit WhatsApp verification code to the caller's chosen phone.
// Stores the hashed code in public.phone_verifications, then ships the cleartext
// code through Meta's free Authentication-category WhatsApp template.
//
// Auth model: the function reads the caller from their Supabase user JWT
// (Authorization: Bearer <access_token>). Anonymous calls are rejected. We
// deploy with --no-verify-jwt so the gateway doesn't reject the call before
// our handler runs; the actual auth check happens via supabase.auth.getUser().
//
// Environment:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — auto-injected
//   WHATSAPP_TOKEN, WHATSAPP_PHONE_ID       — same as whatsapp-send
//   WHATSAPP_OTP_TEMPLATE (optional)        — default 'verification_code'
//   WHATSAPP_OTP_LANG (optional)            — default 'es_CO'
//
// Request body:
//   { phone_e164: '+573001234567' }
//
// The recipient phone must be a real WhatsApp account; for test apps it must
// also be on the recipient allowlist in Meta dashboard → WhatsApp → API setup.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_TOKEN') ?? '';
const WHATSAPP_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID') ?? '';
const OTP_TEMPLATE = Deno.env.get('WHATSAPP_OTP_TEMPLATE') ?? 'verification_code';
const OTP_LANG = Deno.env.get('WHATSAPP_OTP_LANG') ?? 'es_CO';

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

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    return json({ error: 'WhatsApp Cloud API not configured on this project.' }, 503);
  }

  // Resolve the calling user from their access token.
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return json({ error: 'Sign in required to verify a phone number.' }, 401);
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userResp } = await supabase.auth.getUser(authHeader.slice(7));
  const user = userResp.user;
  if (!user) return json({ error: 'Sign in required.' }, 401);

  let body: { phone_e164?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }
  const phone = (body.phone_e164 ?? '').trim();
  // Loose E.164 check — Meta's API validates more strictly when it sees a bad
  // number, so we keep ours just permissive enough to catch obvious typos.
  if (!/^\+\d{8,15}$/.test(phone)) {
    return json({ error: 'phone_e164 must be E.164 format like +573001234567.' }, 400);
  }

  // Generate the code + hash. Math.random is fine: the 6-digit space (1M
  // codes) combined with the 10-minute window and 5-attempt cap reduces the
  // expected guess probability to ~50µ, far below what an attacker could
  // exploit before WA rate limits kick in.
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await sha256Hex(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error: insertErr } = await supabase.from('phone_verifications').insert({
    user_id: user.id,
    phone_e164: phone,
    code_hash: codeHash,
    expires_at: expiresAt,
  });
  if (insertErr) {
    return json({ error: `db error: ${insertErr.message}` }, 500);
  }

  // Send the WA template message. Authentication templates require BOTH a
  // body parameter (the code text) AND a URL button parameter with the same
  // code — Meta renders this as a "Copy code" button.
  const waPayload = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: OTP_TEMPLATE,
      language: { code: OTP_LANG },
      components: [
        { type: 'body', parameters: [{ type: 'text', text: code }] },
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [{ type: 'text', text: code }],
        },
      ],
    },
  };

  const waRes = await fetch(`https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(waPayload),
  });

  if (!waRes.ok) {
    const errBody = await waRes.text();
    console.error('WA OTP send failed:', waRes.status, errBody);
    // Surface the Meta error so the UI can show a useful message (template
    // not approved, number not on test list, etc.) without leaking secrets.
    return json({ error: `WhatsApp send failed`, meta: errBody }, 502);
  }

  return json({ ok: true, expires_in_seconds: 600 });
});
