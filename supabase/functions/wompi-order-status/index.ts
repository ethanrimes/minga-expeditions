// Public-safe poller for the order success page. Returns the minimum
// information needed to render confirmation; never returns PII or full
// payment metadata. The order id is a UUID (unguessable), so handing it back
// to the originating browser is safe.
//
// Reconciliation safety net: when the DB still shows "pending" (the webhook
// either hasn't arrived or was rejected), we hit Wompi's public Transactions
// API directly with our `wompi_reference` and write the result back. This
// keeps the OrderSuccessPage from waiting indefinitely on a webhook that may
// never come (sandbox especially is unreliable about events).

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
// Wompi exposes two base URLs: sandbox for test integrations, production for
// real money. We default to sandbox since that's the safer mistake; production
// deployments override via env.
const WOMPI_API_BASE = Deno.env.get('WOMPI_API_BASE') ?? 'https://sandbox.wompi.co/v1';

type WompiStatus = 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING';

interface WompiTransaction {
  id: string;
  reference: string;
  status: WompiStatus;
  payment_method_type?: string | null;
  status_message?: string | null;
  finalized_at?: string | null;
}

function mapStatus(s: WompiStatus) {
  switch (s) {
    case 'APPROVED': return 'approved' as const;
    case 'DECLINED': return 'declined' as const;
    case 'VOIDED':   return 'voided' as const;
    case 'ERROR':    return 'error' as const;
    case 'PENDING':  return 'pending' as const;
  }
}

async function fetchWompiTransactionByReference(reference: string): Promise<WompiTransaction | null> {
  // The Transactions endpoint accepts ?reference=<our_ref> and returns the
  // matching transaction(s). Public — no auth required for reads.
  try {
    const url = `${WOMPI_API_BASE}/transactions?reference=${encodeURIComponent(reference)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: WompiTransaction[] };
    const list = body.data ?? [];
    if (list.length === 0) return null;
    // If multiple (retries), pick the most recent terminal one; otherwise the
    // first. Wompi returns them ordered by created_at descending.
    const terminal = list.find((t) => t.status !== 'PENDING');
    return terminal ?? list[0];
  } catch (e) {
    console.error('wompi transactions lookup failed', e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response('POST only', { status: 405, headers: corsHeaders });
  }

  let body: { orderId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (!body.orderId) {
    return new Response(JSON.stringify({ error: 'orderId required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // First read what we have. We need the wompi_reference to fall back to a
  // direct Wompi lookup, plus the joined expedition details for the response.
  const baseSelect = `id, status, amount_cents, currency, paid_at, wompi_status_message, wompi_reference,
     expedition:expeditions ( id, title, location_name, country )`;
  let { data, error } = await supabase
    .from('orders')
    .select(baseSelect)
    .eq('id', body.orderId)
    .maybeSingle();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (!data) {
    return new Response(JSON.stringify({ error: 'not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // If we're still pending, ask Wompi directly. This catches the case where
  // events are misconfigured or temporarily down — the user shouldn't have
  // to stare at "Confirming…" forever after a successful approve.
  if (data.status === 'pending' && data.wompi_reference) {
    const tx = await fetchWompiTransactionByReference(data.wompi_reference);
    if (tx && tx.status !== 'PENDING') {
      const mapped = mapStatus(tx.status);
      const update: Record<string, unknown> = {
        status: mapped,
        wompi_transaction_id: tx.id,
        wompi_payment_method_type: tx.payment_method_type ?? null,
        wompi_status_message: tx.status_message ?? null,
      };
      if (mapped === 'approved') {
        update.paid_at = tx.finalized_at ?? new Date().toISOString();
      }
      const { error: updErr } = await supabase
        .from('orders')
        .update(update)
        .eq('id', body.orderId);
      if (!updErr) {
        // Re-read so the response reflects the reconciled state.
        const refetch = await supabase
          .from('orders')
          .select(baseSelect)
          .eq('id', body.orderId)
          .maybeSingle();
        if (refetch.data) data = refetch.data;
      }
    }
  }

  // Strip wompi_reference from the public response — it's an internal id.
  const { wompi_reference: _ref, ...publicFields } = data as Record<string, unknown>;
  return new Response(JSON.stringify(publicFields), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
