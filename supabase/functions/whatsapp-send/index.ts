// Sends a WhatsApp message via the Meta Cloud API. Used by other Edge
// Functions (and direct admin actions) to deliver order confirmations,
// vendor proposal acknowledgements, and other transactional messages.
//
// This function trusts its callers — it's only invokable with the service
// role key. Do NOT add an anon-callable path: the WhatsApp template list +
// recipient must be controlled.
//
// Environment:
//   WHATSAPP_TOKEN           — permanent system user token from Meta
//   WHATSAPP_PHONE_ID        — sender phone number id from Meta
//
// Request body:
//   { to: "+57…", template: "order_confirmation", params: ["…","…"] }
//   or
//   { to: "+57…", body: "Plain text message" }     // session-window only
//
// Reference: https://developers.facebook.com/docs/whatsapp/cloud-api

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_TOKEN')!;
const WHATSAPP_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface SendBody {
  to: string;
  template?: string;
  language?: string;
  params?: string[];
  body?: string;
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });

  // Caller must present the service-role key; otherwise this could be abused
  // to send spam to arbitrary numbers.
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.endsWith(SUPABASE_SERVICE_ROLE_KEY)) {
    return new Response('forbidden', { status: 403 });
  }

  let payload: SendBody;
  try {
    payload = await req.json();
  } catch {
    return new Response('invalid json', { status: 400 });
  }
  if (!payload.to) return new Response('to is required', { status: 400 });

  const meta: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    to: payload.to,
  };

  if (payload.template) {
    meta.type = 'template';
    meta.template = {
      name: payload.template,
      language: { code: payload.language ?? 'es_CO' },
      components: payload.params?.length
        ? [
            {
              type: 'body',
              parameters: payload.params.map((text) => ({ type: 'text', text })),
            },
          ]
        : undefined,
    };
  } else if (payload.body) {
    meta.type = 'text';
    meta.text = { body: payload.body };
  } else {
    return new Response('template or body required', { status: 400 });
  }

  const res = await fetch(`https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(meta),
  });

  const text = await res.text();
  return new Response(text, { status: res.status, headers: { 'Content-Type': 'application/json' } });
});
