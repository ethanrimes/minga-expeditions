// Receives Wompi event notifications and reconciles the order row.
//
// Wompi's "Eventos" (events) integration:
//   - Events are POSTed to this URL.
//   - Each event includes a `signature.checksum` computed as
//     SHA256(<concatenated property values per signature.properties> +
//            <timestamp> + <events_secret>).
//   - We verify the checksum before trusting any data.
//
// Reference: https://docs.wompi.co/docs/colombia/eventos
//
// Environment:
//   WOMPI_EVENTS_SECRET — provided by Wompi when you enable events.
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — to update the order.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WOMPI_EVENTS_SECRET = Deno.env.get('WOMPI_EVENTS_SECRET')!;

interface WompiEvent {
  event: string;
  data: {
    transaction: {
      id: string;
      reference: string;
      status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING';
      amount_in_cents: number;
      currency: string;
      payment_method_type?: string;
      status_message?: string;
      created_at?: string;
      finalized_at?: string;
    };
  };
  sent_at?: string;
  timestamp: number;
  signature: {
    checksum: string;
    properties: string[];
  };
  environment?: 'prod' | 'test';
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function getValueByPath(obj: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined), obj);
}

function mapStatus(s: WompiEvent['data']['transaction']['status']) {
  switch (s) {
    case 'APPROVED': return 'approved' as const;
    case 'DECLINED': return 'declined' as const;
    case 'VOIDED':   return 'voided'   as const;
    case 'ERROR':    return 'error'    as const;
    case 'PENDING':  return 'pending'  as const;
  }
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });

  let event: WompiEvent;
  try {
    event = await req.json();
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  // ---- Verify signature --------------------------------------------------
  // Wompi's `signature.properties` are paths relative to `event.data`, not
  // the event root — e.g., "transaction.id" → event.data.transaction.id.
  // Reference: https://docs.wompi.co/docs/colombia/eventos
  const concatenated =
    event.signature.properties.map((p) => String(getValueByPath(event.data, p) ?? '')).join('') +
    String(event.timestamp) +
    WOMPI_EVENTS_SECRET;
  const expected = await sha256Hex(concatenated);
  if (expected !== event.signature.checksum) {
    return new Response('invalid signature', { status: 401 });
  }

  // ---- Update the order --------------------------------------------------
  const tx = event.data.transaction;
  const status = mapStatus(tx.status);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const update: Record<string, unknown> = {
    status,
    wompi_transaction_id: tx.id,
    wompi_payment_method_type: tx.payment_method_type ?? null,
    wompi_status_message: tx.status_message ?? null,
  };
  if (status === 'approved') update.paid_at = tx.finalized_at ?? new Date().toISOString();

  const { error } = await supabase.from('orders').update(update).eq('wompi_reference', tx.reference);
  if (error) return new Response(`db error: ${error.message}`, { status: 500 });

  // Fire-and-forget confirmations when the payment is approved. Run both
  // channels in parallel; either may fail (template not approved, phone not
  // on test list, RESEND_API_KEY missing) and we still want the other one
  // to land.
  if (status === 'approved') {
    await Promise.all([
      sendOrderConfirmation(supabase, tx.reference).catch((e) =>
        console.error('whatsapp confirmation failed', e),
      ),
      sendOrderEmailConfirmation(supabase, tx.reference).catch((e) =>
        console.error('email confirmation failed', e),
      ),
    ]);
    // Do not fail the webhook on a delivery error — Wompi will retry the
    // event, which would double-confirm the order in the DB. The admin can
    // resend manually from the orders dashboard.
  }

  return new Response('ok', { status: 200 });
});

interface OrderForConfirmation {
  amount_cents: number;
  currency: string;
  expedition: { title: string } | null;
  guest: { phone: string | null; email: string | null; display_name: string | null } | null;
  profile: { display_name: string | null } | null;
}

async function loadOrderForConfirmation(
  supabase: ReturnType<typeof createClient>,
  reference: string,
): Promise<OrderForConfirmation | null> {
  const { data: order } = await supabase
    .from('orders')
    .select(
      `id, amount_cents, currency, buyer_profile_id, buyer_guest_contact_id,
       expedition:expeditions ( title ),
       guest:guest_contacts ( phone, email, display_name ),
       profile:profiles ( display_name )`,
    )
    .eq('wompi_reference', reference)
    .maybeSingle();
  return (order as unknown as OrderForConfirmation | null) ?? null;
}

function formatAmount(amountCents: number, currency: string): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency }).format(amountCents / 100);
}

async function sendOrderConfirmation(
  supabase: ReturnType<typeof createClient>,
  reference: string,
) {
  const order = await loadOrderForConfirmation(supabase, reference);
  if (!order) return;
  const phone = order.guest?.phone ?? null;
  if (!phone) return; // No WhatsApp delivery target.

  const expeditionTitle = order.expedition?.title ?? 'your trip';
  const friendlyAmount = formatAmount(order.amount_cents, order.currency);

  const FUNCTIONS_BASE = `${Deno.env.get('SUPABASE_URL')}/functions/v1`;
  await fetch(`${FUNCTIONS_BASE}/whatsapp-send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify({
      to: phone,
      // Template `order_confirmation` must be created in Meta Business
      // Manager with two variables: {{1}} = expedition title, {{2}} = amount.
      template: 'order_confirmation',
      language: 'es_CO',
      params: [expeditionTitle, friendlyAmount],
    }),
  });
}

async function sendOrderEmailConfirmation(
  supabase: ReturnType<typeof createClient>,
  reference: string,
) {
  const order = await loadOrderForConfirmation(supabase, reference);
  if (!order) return;
  const email = order.guest?.email ?? null;
  if (!email) return; // No email target.

  const name = order.profile?.display_name ?? order.guest?.display_name ?? 'viajero';
  const expeditionTitle = order.expedition?.title ?? 'tu próxima expedición';
  const friendlyAmount = formatAmount(order.amount_cents, order.currency);

  const FUNCTIONS_BASE = `${Deno.env.get('SUPABASE_URL')}/functions/v1`;
  await fetch(`${FUNCTIONS_BASE}/email-send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify({
      to: email,
      template: 'order_confirmation',
      params: { name, title: expeditionTitle, amount: friendlyAmount },
    }),
  });
}
