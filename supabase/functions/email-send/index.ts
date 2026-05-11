// Sends an email via Resend's API. Used by other Edge Functions to deliver
// booking confirmations, password recovery prompts, and other transactional
// messages.
//
// Like whatsapp-send, this function trusts its callers — only invokable
// with the service role key. Don't add an anon-callable path; recipient +
// content must be controlled.
//
// Environment:
//   RESEND_API_KEY  — provisioned via Vercel Marketplace or resend.com
//   EMAIL_FROM      — optional. Defaults to Resend's playground sender for
//                     dev use; replace with a verified Minga sender before
//                     handover (e.g. "Minga Expeditions <noreply@minga.co>")
//
// Request body:
//   { to: "user@example.com", template: "order_confirmation",
//     params: { name, title, amount } }
//   or
//   { to: "user@example.com", subject: "Hi", html: "<p>…</p>" }
//
// Reference: https://resend.com/docs/api-reference/emails/send-email

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'Minga Expeditions <onboarding@resend.dev>';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type EmailTemplate = 'order_confirmation';

interface SendBody {
  to: string;
  subject?: string;
  html?: string;
  text?: string;
  template?: EmailTemplate;
  params?: Record<string, string>;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)
  );
}

interface RenderedTemplate {
  subject: string;
  html: string;
  text: string;
}

// Server-side template renderers. Kept inline (rather than in a separate
// module) so each template is its own self-contained unit that's trivial
// to read and tweak without touching the dispatch logic.
const TEMPLATES: Record<EmailTemplate, (p: Record<string, string>) => RenderedTemplate> = {
  order_confirmation: ({ name = 'viajero', title = 'tu próxima expedición', amount = '' }) => ({
    subject: `¡Reserva confirmada! · ${title}`,
    html: `
<!doctype html>
<html lang="es">
<body style="margin:0;padding:32px;background:#fafaf7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;line-height:1.5;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 16px rgba(0,0,0,0.05);">
    <p style="color:#ea580c;font-weight:700;letter-spacing:1px;text-transform:uppercase;font-size:12px;margin:0 0 8px;">Minga Expeditions</p>
    <h1 style="font-size:24px;font-weight:800;margin:0 0 16px;color:#1a1a1a;">¡Reserva confirmada! 🎉</h1>
    <p>Hola ${escapeHtml(name)},</p>
    <p>Tu pago para <strong>${escapeHtml(title)}</strong>${amount ? ` por <strong>${escapeHtml(amount)}</strong>` : ''} se ha procesado correctamente.</p>
    <p>Tu cupo está reservado. Si proporcionaste un número de WhatsApp también te enviaremos un mensaje con los detalles del viaje. Pronto te contactaremos con instrucciones de encuentro y lista de equipo.</p>
    <p style="margin-top:32px;color:#6b7280;font-size:14px;">¿Preguntas? Responde este correo o escríbenos a <a href="mailto:hello@minga.co" style="color:#ea580c;">hello@minga.co</a>.</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;" />
    <p style="color:#9ca3af;font-size:12px;margin:0;">Minga Expeditions · <a href="https://minga-expeditions-web.vercel.app" style="color:#9ca3af;">minga-expeditions-web.vercel.app</a></p>
  </div>
</body>
</html>`.trim(),
    text:
      `¡Reserva confirmada!\n\n` +
      `Hola ${name},\n\n` +
      `Tu pago para "${title}"${amount ? ` por ${amount}` : ''} se ha procesado correctamente. Tu cupo está reservado.\n\n` +
      `Pronto te contactaremos con instrucciones de encuentro y lista de equipo.\n\n` +
      `¿Preguntas? hello@minga.co\n\n` +
      `— Minga Expeditions`,
  }),
};

serve(async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });

  // Service-role gate (mirrors whatsapp-send).
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.endsWith(SUPABASE_SERVICE_ROLE_KEY)) {
    return new Response('forbidden', { status: 403 });
  }

  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'RESEND_API_KEY not configured on the Edge Function. Email send skipped.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let payload: SendBody;
  try {
    payload = await req.json();
  } catch {
    return new Response('invalid json', { status: 400 });
  }
  if (!payload.to) return new Response('to is required', { status: 400 });

  // Resolve subject + html + text from either template or explicit fields.
  let subject = payload.subject ?? '';
  let html = payload.html ?? '';
  let text = payload.text ?? '';
  if (payload.template) {
    const renderer = TEMPLATES[payload.template];
    if (!renderer) return new Response(`unknown template: ${payload.template}`, { status: 400 });
    const rendered = renderer(payload.params ?? {});
    subject = subject || rendered.subject;
    html = html || rendered.html;
    text = text || rendered.text;
  }
  if (!subject || (!html && !text)) {
    return new Response('subject and html or text required', { status: 400 });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [payload.to],
      subject,
      html: html || undefined,
      text: text || undefined,
    }),
  });

  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
});
