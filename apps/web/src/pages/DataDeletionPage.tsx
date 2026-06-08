import React from 'react';
import { useT } from '@minga/i18n';
import { useTheme } from '@minga/theme';

const CONTACT_EMAIL = 'hello@minga.co';
const AUTH_URL = 'minga-expeditions-web.vercel.app/auth';

const copy = {
  en: {
    eyebrow: 'Legal',
    title: 'Data Deletion',
    lastUpdated: 'Last updated:',
    sections: {
      right: {
        title: 'Your right to delete',
        body: 'You can delete your Minga Expeditions account and all associated personal data at any time. This page explains how, what gets removed, and what (if anything) we are required to retain.',
      },
      selfService: {
        title: 'Self-service from inside the app',
        steps: {
          signIn: 'Sign in at',
          open: 'Open',
          settings: 'Settings',
          scroll: 'Scroll to',
          deleteAccount: 'Delete account',
          confirm: 'Confirm. Deletion is immediate and irreversible.',
        },
      },
      email: {
        title: 'By email',
        beforeEmail: "If you can't access the app for any reason (lost password, lost device, provider issue), email",
        afterEmail: 'from the address tied to your account, with subject line',
        subject: 'Delete my account',
        afterSubject: 'We will verify your identity and remove your data within 30 days.',
      },
      providers: {
        title: 'If you signed in via Facebook, Google, or Instagram',
        beforeEmphasis: "Revoking the Minga app's permission inside your social provider's settings",
        emphasis: 'does not',
        afterEmphasis: 'automatically delete your Minga account - only future sign-ins. To fully delete, use the in-app flow above or email us. Provider-side revocation links:',
      },
      deleted: {
        title: 'What gets deleted',
        items: [
          'Your profile (display name, avatar, bio, country)',
          'Every expedition you authored',
          'Every activity, GPS track, and attached photo',
          'Every comment, like, and rating you posted',
          'Crash and error telemetry tied to your user ID in Sentry',
          'WhatsApp opt-in records',
        ],
      },
      retain: {
        title: 'What we retain (and why)',
        intro: 'Colombian law and standard financial-record retention require us to keep a minimal subset of data, redacted of direct identifiers where possible:',
        items: [
          ['Payment receipts', 'tied to bookings you made (your name + transaction amount + date) - retained for 5 years per DIAN tax record requirements'],
          ['Anonymized usage metrics', 'aggregate counters with no link back to you - retained indefinitely'],
        ],
        outro: 'Everything else is hard-deleted from our database within 30 days. Daily Postgres backups are aged out within 7 days, so your record fully disappears within that window.',
      },
      timeline: {
        title: 'Timeline',
        body: 'Most deletions complete within a few minutes (in-app flow) or within 24 hours (email request). The 30-day window is the upper bound for edge cases. Backups containing your data are purged within 7 days of the deletion request.',
      },
      questions: {
        title: 'Questions',
      },
    },
  },
  es: {
    eyebrow: 'Legal',
    title: 'Eliminación de datos',
    lastUpdated: 'Última actualización:',
    sections: {
      right: {
        title: 'Tu derecho a eliminar',
        body: 'Puedes eliminar tu cuenta de Minga Expeditions y todos los datos personales asociados en cualquier momento. Esta página explica cómo hacerlo, qué se elimina y qué datos (si aplica) estamos obligados a conservar.',
      },
      selfService: {
        title: 'Autoservicio dentro de la app',
        steps: {
          signIn: 'Inicia sesión en',
          open: 'Abre',
          settings: 'Configuración',
          scroll: 'Desplázate hasta',
          deleteAccount: 'Eliminar cuenta',
          confirm: 'Confirma. La eliminación es inmediata e irreversible.',
        },
      },
      email: {
        title: 'Por correo',
        beforeEmail: 'Si no puedes acceder a la app por cualquier motivo (contraseña perdida, dispositivo perdido o problema del proveedor), escribe a',
        afterEmail: 'desde la dirección asociada a tu cuenta, con el asunto',
        subject: 'Eliminar mi cuenta',
        afterSubject: 'Verificaremos tu identidad y eliminaremos tus datos dentro de 30 días.',
      },
      providers: {
        title: 'Si iniciaste sesión con Facebook, Google o Instagram',
        beforeEmphasis: 'Revocar el permiso de la app Minga dentro de la configuración de tu proveedor social',
        emphasis: 'no elimina',
        afterEmphasis: 'automáticamente tu cuenta de Minga; solo impide futuros inicios de sesión. Para eliminarla por completo, usa el flujo dentro de la app o escríbenos. Enlaces de revocación por proveedor:',
      },
      deleted: {
        title: 'Qué se elimina',
        items: [
          'Tu perfil (nombre visible, avatar, biografía, país)',
          'Todas las expediciones que publicaste',
          'Todas las actividades, rutas GPS y fotos adjuntas',
          'Todos los comentarios, me gusta y calificaciones que publicaste',
          'Telemetría de fallos y errores vinculada a tu ID de usuario en Sentry',
          'Registros de aceptación de WhatsApp',
        ],
      },
      retain: {
        title: 'Qué conservamos (y por qué)',
        intro: 'La ley colombiana y la retención estándar de registros financieros nos exigen conservar un subconjunto mínimo de datos, redactado de identificadores directos cuando sea posible:',
        items: [
          ['Recibos de pago', 'vinculados a reservas que realizaste (tu nombre, monto de transacción y fecha), conservados durante 5 años por requisitos de registros tributarios de la DIAN'],
          ['Métricas de uso anonimizadas', 'contadores agregados sin vínculo contigo, conservados indefinidamente'],
        ],
        outro: 'Todo lo demás se elimina de forma permanente de nuestra base de datos dentro de 30 días. Las copias de seguridad diarias de Postgres caducan dentro de 7 días, por lo que tu registro desaparece por completo dentro de ese plazo.',
      },
      timeline: {
        title: 'Cronograma',
        body: 'La mayoría de eliminaciones se completan en pocos minutos (flujo dentro de la app) o dentro de 24 horas (solicitud por correo). La ventana de 30 días es el límite máximo para casos excepcionales. Las copias de seguridad que contengan tus datos se purgan dentro de 7 días de la solicitud de eliminación.',
      },
      questions: {
        title: 'Preguntas',
      },
    },
  },
};

export function DataDeletionPage() {
  const { language } = useT();
  const { theme } = useTheme();
  const text = copy[language];
  const updated = new Date().toLocaleDateString(language === 'es' ? 'es-CO' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <article style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 96px', color: theme.text, lineHeight: 1.6 }}>
      <header style={{ marginBottom: 32 }}>
        <p style={{ color: theme.primary, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: 12 }}>
          {text.eyebrow}
        </p>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginTop: 8 }}>{text.title}</h1>
        <p style={{ color: theme.textMuted, marginTop: 12 }}>
          {text.lastUpdated} {updated}
        </p>
      </header>

      <Section title={text.sections.right.title} theme={theme}>{text.sections.right.body}</Section>
      <Section title={text.sections.selfService.title} theme={theme}>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li>{text.sections.selfService.steps.signIn} <a href="/auth" style={{ color: theme.primary }}>{AUTH_URL}</a></li>
          <li>{text.sections.selfService.steps.open} <a href="/settings" style={{ color: theme.primary }}>{text.sections.selfService.steps.settings}</a></li>
          <li>{text.sections.selfService.steps.scroll} <strong>{text.sections.selfService.steps.deleteAccount}</strong></li>
          <li>{text.sections.selfService.steps.confirm}</li>
        </ol>
      </Section>
      <Section title={text.sections.email.title} theme={theme}>
        {text.sections.email.beforeEmail}{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: theme.primary }}>{CONTACT_EMAIL}</a>{' '}
        {text.sections.email.afterEmail} <code>{text.sections.email.subject}</code>. {text.sections.email.afterSubject}
      </Section>
      <Section title={text.sections.providers.title} theme={theme}>
        {text.sections.providers.beforeEmphasis} <em>{text.sections.providers.emphasis}</em>{' '}
        {text.sections.providers.afterEmphasis}
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>Facebook: <a href="https://www.facebook.com/settings?tab=applications" style={{ color: theme.primary }}>facebook.com/settings?tab=applications</a></li>
          <li>Instagram: <a href="https://www.instagram.com/accounts/manage_access/" style={{ color: theme.primary }}>instagram.com/accounts/manage_access</a></li>
          <li>Google: <a href="https://myaccount.google.com/permissions" style={{ color: theme.primary }}>myaccount.google.com/permissions</a></li>
        </ul>
      </Section>
      <Section title={text.sections.deleted.title} theme={theme}>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          {text.sections.deleted.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </Section>
      <Section title={text.sections.retain.title} theme={theme}>
        {text.sections.retain.intro}
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          {text.sections.retain.items.map(([label, body]) => (
            <li key={label}><strong>{label}</strong> {body}</li>
          ))}
        </ul>
        {text.sections.retain.outro}
      </Section>
      <Section title={text.sections.timeline.title} theme={theme}>{text.sections.timeline.body}</Section>
      <Section title={text.sections.questions.title} theme={theme}>
        <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: theme.primary }}>{CONTACT_EMAIL}</a>
      </Section>
    </article>
  );
}

function Section({ title, theme, children }: { title: string; theme: ReturnType<typeof useTheme>['theme']; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.text, marginBottom: 8 }}>{title}</h2>
      <div style={{ color: theme.textMuted }}>{children}</div>
    </section>
  );
}
