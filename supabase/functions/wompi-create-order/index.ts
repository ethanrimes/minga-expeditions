// Creates a pending `orders` row + a `guest_contacts` row (or links to an
// existing profile if signed in) and returns the signed Wompi widget config
// the browser needs to open the checkout.
//
// Inputs (JSON body):
//   {
//     expedition_id: uuid,
//     guest: {
//       email?: string,
//       phone?: string,
//       display_name?: string,
//     },
//     // If the caller is signed in, the function picks the profile id from
//     // the JWT instead of using `guest`.
//   }
//
// Output:
//   {
//     orderId: uuid,
//     reference: string,
//     amountInCents: number,
//     currency: string,
//     publicKey: string,
//     signature: string,         // sha256(reference + amount + currency + integrityKey)
//     redirectUrl: string,
//   }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders } from '../_shared/cors.ts';

interface GuestInput {
  email?: string | null;
  phone?: string | null;
  display_name?: string | null;
}

interface RequestBody {
  expedition_id: string;
  guest?: GuestInput;
  return_path?: string; // e.g. "/orders/<id>/success"
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WOMPI_PUBLIC_KEY = Deno.env.get('WOMPI_PUBLIC_KEY')!;
const WOMPI_INTEGRITY_KEY = Deno.env.get('WOMPI_INTEGRITY_KEY')!;
// Where Wompi sends the user back after the widget closes. Configure per
// environment; this is the public origin of the consumer-facing site.
const PUBLIC_SITE_URL = Deno.env.get('PUBLIC_SITE_URL') ?? 'http://localhost:5173';

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function bad(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return bad(405, 'POST only');

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return bad(400, 'Invalid JSON');
  }
  if (!body.expedition_id) return bad(400, 'expedition_id is required');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ---- 1. Resolve buyer (signed-in vs guest) -----------------------------
  const authHeader = req.headers.get('Authorization');
  let profileId: string | null = null;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const { data: u } = await supabase.auth.getUser(token);
    if (u.user) profileId = u.user.id;
  }

  let guestContactId: string | null = null;
  if (!profileId) {
    const guest = body.guest ?? {};
    const email = guest.email?.trim() || null;
    const phone = guest.phone?.trim() || null;
    const displayName = guest.display_name?.trim() || null;
    if (!email && !phone) return bad(400, 'Provide an email or WhatsApp phone for the guest.');

    // Re-use an existing guest_contacts row if email or phone matches; this
    // keeps a guest's history together if they buy twice before signing up.
    const { data: existing } = await supabase
      .from('guest_contacts')
      .select('id')
      .or(
        [
          email ? `email.ilike.${email}` : null,
          phone ? `phone.eq.${phone}` : null,
        ]
          .filter(Boolean)
          .join(','),
      )
      .limit(1)
      .maybeSingle();

    if (existing) {
      guestContactId = (existing as { id: string }).id;
    } else {
      const { data: created, error } = await supabase
        .from('guest_contacts')
        .insert({ email, phone, display_name: displayName })
        .select('id')
        .single();
      if (error) return bad(500, `guest_contacts insert failed: ${error.message}`);
      guestContactId = (created as { id: string }).id;
    }
  }

  // ---- 2. Look up the expedition for amount + currency -------------------
  const { data: expedition, error: expErr } = await supabase
    .from('expeditions')
    .select('id, title, price_cents, currency, is_published')
    .eq('id', body.expedition_id)
    .maybeSingle();
  if (expErr || !expedition) return bad(404, 'Expedition not found');
  if (!expedition.is_published) return bad(400, 'Expedition is not on sale');
  if (expedition.price_cents <= 0) return bad(400, 'Expedition is free — no payment needed');

  // ---- 3. Insert the pending order with a fresh Wompi reference ----------
  const reference = crypto.randomUUID();
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      expedition_id: expedition.id,
      buyer_profile_id: profileId,
      buyer_guest_contact_id: guestContactId,
      amount_cents: expedition.price_cents,
      currency: expedition.currency,
      status: 'pending',
      wompi_reference: reference,
      metadata: { expedition_title: expedition.title },
    })
    .select('id')
    .single();
  if (orderErr || !order) return bad(500, `order insert failed: ${orderErr?.message ?? '?'}`);

  // ---- 4. Sign + return the widget config --------------------------------
  const signature = await sha256Hex(
    `${reference}${expedition.price_cents}${expedition.currency}${WOMPI_INTEGRITY_KEY}`,
  );
  const returnPath = body.return_path ?? `/orders/${order.id}/success`;
  const redirectUrl = new URL(returnPath, PUBLIC_SITE_URL).toString();

  return new Response(
    JSON.stringify({
      orderId: order.id,
      reference,
      amountInCents: expedition.price_cents,
      currency: expedition.currency,
      publicKey: WOMPI_PUBLIC_KEY,
      signature,
      redirectUrl,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
