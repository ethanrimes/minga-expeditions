import React from 'react';
import { useT } from '@minga/i18n';
import { useTheme } from '@minga/theme';

const CONTACT_EMAIL = 'hello@minga.co';

const copy = {
  en: {
    eyebrow: 'Legal',
    title: 'Privacy Policy',
    lastUpdated: 'Last updated:',
    sections: {
      overview: {
        title: 'Overview',
        body: 'Minga Expeditions ("Minga", "we", "us") is a proof-of-concept traveler community and activity-tracking app for Colombia. This policy explains what data we collect when you use the website, mobile-frame preview, or mobile app, and how we use it.',
      },
      collect: {
        title: 'What we collect',
        items: [
          ['Account data', 'email, display name, profile photo. Collected when you sign up by email/password or via Facebook, Google, or Instagram login.'],
          ['Activity data', 'GPS coordinates, distance, elevation, timestamps, photos you attach. Recorded only when you explicitly start a tracking session.'],
          ['Booking data', 'name, email, WhatsApp phone, expedition selection, payment status. Only collected if you book a paid expedition.'],
          ['Crash + error telemetry', 'stack traces, device model, OS version, app version. Used to fix bugs. Sent through Sentry.'],
        ],
      },
      dontCollect: {
        title: "What we don't collect",
        body: 'We do not run advertising trackers, do not sell or share data with third-party advertisers, and do not access your contacts, microphone, or camera outside of explicit user-initiated actions (taking a photo to attach to an activity).',
      },
      dataLives: {
        title: 'Where your data lives',
        body: "Account and activity data are stored in Supabase (Postgres in AWS us-west-2). Payments are processed by Wompi (Colombia). Authentication via Facebook / Google / Instagram is handled through Supabase's auth gateway, which exchanges OAuth tokens with each provider on your behalf. We never see your provider passwords.",
      },
      whatsapp: {
        title: 'WhatsApp notifications',
        body: 'If you book an expedition and supply a WhatsApp number, we send booking confirmations and trip-day reminders through the WhatsApp Business API. You may opt out at any time by replying STOP to any message, or by deleting your account.',
      },
      rights: {
        title: 'Your rights',
        beforeEmail: 'You can request a copy of your data, correct any inaccuracies, or delete your account at any time. Email',
        afterEmail: 'and we will respond within 30 days.',
      },
      cookies: {
        title: 'Cookies',
        body: 'The website uses a single session cookie set by Supabase to keep you signed in. No third-party analytics or advertising cookies are set.',
      },
      children: {
        title: 'Children',
        body: 'Minga is intended for travelers 18 years or older. We do not knowingly collect data from children under 13. If we learn we have inadvertently done so, we will delete the account and associated data on request.',
      },
      changes: {
        title: 'Changes to this policy',
        body: 'We may update this policy as the product evolves. The "last updated" date at the top reflects the most recent revision. Material changes will be announced via in-app banner or email to registered users.',
      },
      contact: {
        title: 'Contact',
        beforeEmail: 'Questions about this policy or your data:',
      },
    },
  },
  es: {
    eyebrow: 'Legal',
    title: 'Política de privacidad',
    lastUpdated: 'Última actualización:',
    sections: {
      overview: {
        title: 'Resumen',
        body: 'Minga Expeditions ("Minga", "nosotros") es una comunidad de viajeros y app de seguimiento de actividades en etapa de prueba de concepto para Colombia. Esta política explica qué datos recopilamos cuando usas el sitio web, la vista previa móvil o la app móvil, y cómo los usamos.',
      },
      collect: {
        title: 'Qué recopilamos',
        items: [
          ['Datos de cuenta', 'correo, nombre visible y foto de perfil. Se recopilan cuando te registras con correo/contraseña o mediante Facebook, Google o Instagram.'],
          ['Datos de actividad', 'coordenadas GPS, distancia, elevación, marcas de tiempo y fotos adjuntas. Se registran solo cuando inicias explícitamente una sesión de seguimiento.'],
          ['Datos de reserva', 'nombre, correo, teléfono de WhatsApp, expedición seleccionada y estado de pago. Solo se recopilan si reservas una expedición pagada.'],
          ['Telemetría de fallos y errores', 'trazas de error, modelo del dispositivo, versión del sistema operativo y versión de la app. Se usa para corregir errores. Se envía mediante Sentry.'],
        ],
      },
      dontCollect: {
        title: 'Qué no recopilamos',
        body: 'No usamos rastreadores publicitarios, no vendemos ni compartimos datos con anunciantes externos, y no accedemos a tus contactos, micrófono o cámara fuera de acciones iniciadas explícitamente por ti (como tomar una foto para adjuntarla a una actividad).',
      },
      dataLives: {
        title: 'Dónde viven tus datos',
        body: 'Los datos de cuenta y actividad se almacenan en Supabase (Postgres en AWS us-west-2). Los pagos son procesados por Wompi (Colombia). La autenticación con Facebook / Google / Instagram se maneja mediante la pasarela de autenticación de Supabase, que intercambia tokens OAuth con cada proveedor en tu nombre. Nunca vemos las contraseñas de tus proveedores.',
      },
      whatsapp: {
        title: 'Notificaciones de WhatsApp',
        body: 'Si reservas una expedición e indicas un número de WhatsApp, enviamos confirmaciones de reserva y recordatorios del día del viaje mediante la API de WhatsApp Business. Puedes darte de baja en cualquier momento respondiendo STOP a cualquier mensaje o eliminando tu cuenta.',
      },
      rights: {
        title: 'Tus derechos',
        beforeEmail: 'Puedes solicitar una copia de tus datos, corregir inexactitudes o eliminar tu cuenta en cualquier momento. Escríbenos a',
        afterEmail: 'y responderemos dentro de 30 días.',
      },
      cookies: {
        title: 'Cookies',
        body: 'El sitio web usa una sola cookie de sesión configurada por Supabase para mantener tu sesión iniciada. No se configuran cookies de analítica ni publicidad de terceros.',
      },
      children: {
        title: 'Menores',
        body: 'Minga está dirigido a viajeros mayores de 18 años. No recopilamos conscientemente datos de menores de 13 años. Si descubrimos que lo hemos hecho por error, eliminaremos la cuenta y los datos asociados cuando se solicite.',
      },
      changes: {
        title: 'Cambios a esta política',
        body: 'Podemos actualizar esta política a medida que el producto evolucione. La fecha de "última actualización" en la parte superior refleja la revisión más reciente. Los cambios importantes se anunciarán mediante un aviso dentro de la app o correo a usuarios registrados.',
      },
      contact: {
        title: 'Contacto',
        beforeEmail: 'Preguntas sobre esta política o tus datos:',
      },
    },
  },
};

export function PrivacyPage() {
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

      <Section title={text.sections.overview.title} theme={theme}>{text.sections.overview.body}</Section>
      <Section title={text.sections.collect.title} theme={theme}>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          {text.sections.collect.items.map(([label, body]) => (
            <li key={label}><strong>{label}</strong> — {body}</li>
          ))}
        </ul>
      </Section>
      <Section title={text.sections.dontCollect.title} theme={theme}>{text.sections.dontCollect.body}</Section>
      <Section title={text.sections.dataLives.title} theme={theme}>{text.sections.dataLives.body}</Section>
      <Section title={text.sections.whatsapp.title} theme={theme}>{text.sections.whatsapp.body}</Section>
      <Section title={text.sections.rights.title} theme={theme}>
        {text.sections.rights.beforeEmail}{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: theme.primary }}>{CONTACT_EMAIL}</a>{' '}
        {text.sections.rights.afterEmail}
      </Section>
      <Section title={text.sections.cookies.title} theme={theme}>{text.sections.cookies.body}</Section>
      <Section title={text.sections.children.title} theme={theme}>{text.sections.children.body}</Section>
      <Section title={text.sections.changes.title} theme={theme}>{text.sections.changes.body}</Section>
      <Section title={text.sections.contact.title} theme={theme}>
        {text.sections.contact.beforeEmail}{' '}
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
