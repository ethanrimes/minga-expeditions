import React from 'react';
import { useT } from '@minga/i18n';
import { useTheme } from '@minga/theme';

const CONTACT_EMAIL = 'hello@minga.co';

const copy = {
  en: {
    eyebrow: 'Legal',
    title: 'Terms of Service',
    lastUpdated: 'Last updated:',
    sections: {
      acceptance: {
        title: 'Acceptance',
        body: 'By creating an account or using Minga Expeditions ("the Service") you agree to these Terms. If you do not agree, do not use the Service.',
      },
      service: {
        title: 'The Service',
        body: 'Minga is a proof-of-concept platform for discovering, booking, and recording expeditions in Colombia. The Service is provided as-is during the development phase; features may change without notice while we iterate.',
      },
      account: {
        title: 'Your account',
        beforeEmail: 'You are responsible for keeping your account credentials secure. You may sign in with email + password or with a Facebook, Google, or Instagram account. You may delete your account at any time from the Settings page or by emailing',
      },
      content: {
        title: 'User content',
        body: 'You retain ownership of expeditions you publish, activities you track, photos you upload, and comments you write. By posting content on the Service you grant Minga a non-exclusive, worldwide license to display that content within the Service to other users.',
      },
      bookings: {
        title: 'Expedition listings + bookings',
        body: 'Some expeditions on Minga are paid. Bookings are processed by Wompi; the relationship for the trip itself is between you and the expedition organizer. Minga facilitates discovery and payment routing but is not responsible for the conduct, safety, or quality of any third-party expedition. Always verify operator credentials and insurance for paid activities.',
      },
      use: {
        title: 'Acceptable use',
        intro: 'Do not use the Service to:',
        items: [
          'publish false expedition information, fake activity tracks, or misleading prices',
          'harass, threaten, or impersonate other users',
          "circumvent the platform's payment flow",
          'scrape data or attempt to access the database directly',
          'reverse-engineer the Service except as permitted by applicable law',
        ],
        outro: 'We may suspend or terminate accounts that violate these rules.',
      },
      payments: {
        title: 'Payments + refunds',
        beforeEmail: 'All charges are made in Colombian pesos (COP) unless explicitly noted. Refund eligibility depends on the policy of the expedition operator and the timing of cancellation. Contact the operator directly, copying',
        afterEmail: 'to request a refund.',
      },
      risk: {
        title: 'Liability + risk',
        body: 'Outdoor activities carry inherent risk. You participate in any tracked or booked expedition at your own risk and are responsible for your own safety, fitness, equipment, and insurance. Minga disclaims liability for injury, loss, or damage arising from participation in any activity discovered through the Service, to the maximum extent permitted by Colombian law.',
      },
      termination: {
        title: 'Termination',
        body: 'You may stop using the Service at any time. We may terminate or suspend accounts that violate these Terms or that we reasonably believe pose a risk to other users or the platform.',
      },
      changes: {
        title: 'Changes to these Terms',
        body: 'We may revise these Terms as the Service evolves. Material changes will be announced via in-app banner or email to registered users. Continued use of the Service after the revised Terms take effect constitutes acceptance.',
      },
      law: {
        title: 'Governing law',
        body: 'These Terms are governed by the laws of the Republic of Colombia. Disputes will be resolved in the courts of Bogota D.C.',
      },
      contact: {
        title: 'Contact',
        beforeEmail: 'Questions about these Terms:',
      },
    },
  },
  es: {
    eyebrow: 'Legal',
    title: 'Términos del servicio',
    lastUpdated: 'Última actualización:',
    sections: {
      acceptance: {
        title: 'Aceptación',
        body: 'Al crear una cuenta o usar Minga Expeditions ("el Servicio") aceptas estos Términos. Si no estás de acuerdo, no uses el Servicio.',
      },
      service: {
        title: 'El Servicio',
        body: 'Minga es una plataforma en etapa de prueba de concepto para descubrir, reservar y registrar expediciones en Colombia. El Servicio se ofrece tal como está durante la fase de desarrollo; las funciones pueden cambiar sin previo aviso mientras iteramos.',
      },
      account: {
        title: 'Tu cuenta',
        beforeEmail: 'Eres responsable de mantener seguras las credenciales de tu cuenta. Puedes iniciar sesión con correo y contraseña o con una cuenta de Facebook, Google o Instagram. Puedes eliminar tu cuenta en cualquier momento desde la página de Configuración o escribiendo a',
      },
      content: {
        title: 'Contenido de usuarios',
        body: 'Conservas la propiedad de las expediciones que publicas, las actividades que registras, las fotos que subes y los comentarios que escribes. Al publicar contenido en el Servicio, otorgas a Minga una licencia no exclusiva y mundial para mostrar ese contenido dentro del Servicio a otros usuarios.',
      },
      bookings: {
        title: 'Listados y reservas de expediciones',
        body: 'Algunas expediciones en Minga son pagadas. Las reservas son procesadas por Wompi; la relación del viaje en sí es entre tú y el organizador de la expedición. Minga facilita el descubrimiento y el enrutamiento del pago, pero no es responsable de la conducta, seguridad o calidad de expediciones de terceros. Verifica siempre las credenciales y el seguro del operador para actividades pagadas.',
      },
      use: {
        title: 'Uso aceptable',
        intro: 'No uses el Servicio para:',
        items: [
          'publicar información falsa de expediciones, actividades simuladas o precios engañosos',
          'acosar, amenazar o suplantar a otros usuarios',
          'evadir el flujo de pagos de la plataforma',
          'extraer datos masivamente o intentar acceder directamente a la base de datos',
          'hacer ingeniería inversa del Servicio excepto según lo permita la ley aplicable',
        ],
        outro: 'Podemos suspender o cancelar cuentas que incumplan estas reglas.',
      },
      payments: {
        title: 'Pagos y reembolsos',
        beforeEmail: 'Todos los cargos se hacen en pesos colombianos (COP), salvo que se indique explícitamente lo contrario. La elegibilidad de reembolso depende de la política del operador de la expedición y del momento de la cancelación. Contacta directamente al operador, copiando a',
        afterEmail: 'para solicitar un reembolso.',
      },
      risk: {
        title: 'Responsabilidad y riesgo',
        body: 'Las actividades al aire libre implican riesgos inherentes. Participas en cualquier expedición registrada o reservada bajo tu propio riesgo y eres responsable de tu seguridad, condición física, equipo y seguro. Minga declina responsabilidad por lesiones, pérdidas o daños derivados de la participación en cualquier actividad descubierta mediante el Servicio, en la máxima medida permitida por la ley colombiana.',
      },
      termination: {
        title: 'Terminación',
        body: 'Puedes dejar de usar el Servicio en cualquier momento. Podemos terminar o suspender cuentas que incumplan estos Términos o que razonablemente consideremos un riesgo para otros usuarios o para la plataforma.',
      },
      changes: {
        title: 'Cambios a estos Términos',
        body: 'Podemos revisar estos Términos a medida que el Servicio evolucione. Los cambios importantes se anunciarán mediante un aviso dentro de la app o correo a usuarios registrados. El uso continuado del Servicio después de que entren en vigor los Términos revisados constituye aceptación.',
      },
      law: {
        title: 'Ley aplicable',
        body: 'Estos Términos se rigen por las leyes de la República de Colombia. Las disputas se resolverán en los tribunales de Bogotá D.C.',
      },
      contact: {
        title: 'Contacto',
        beforeEmail: 'Preguntas sobre estos Términos:',
      },
    },
  },
};

export function TermsPage() {
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

      <Section title={text.sections.acceptance.title} theme={theme}>{text.sections.acceptance.body}</Section>
      <Section title={text.sections.service.title} theme={theme}>{text.sections.service.body}</Section>
      <Section title={text.sections.account.title} theme={theme}>
        {text.sections.account.beforeEmail}{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: theme.primary }}>{CONTACT_EMAIL}</a>.
      </Section>
      <Section title={text.sections.content.title} theme={theme}>{text.sections.content.body}</Section>
      <Section title={text.sections.bookings.title} theme={theme}>{text.sections.bookings.body}</Section>
      <Section title={text.sections.use.title} theme={theme}>
        {text.sections.use.intro}
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          {text.sections.use.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
        {text.sections.use.outro}
      </Section>
      <Section title={text.sections.payments.title} theme={theme}>
        {text.sections.payments.beforeEmail}{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: theme.primary }}>{CONTACT_EMAIL}</a>,{' '}
        {text.sections.payments.afterEmail}
      </Section>
      <Section title={text.sections.risk.title} theme={theme}>{text.sections.risk.body}</Section>
      <Section title={text.sections.termination.title} theme={theme}>{text.sections.termination.body}</Section>
      <Section title={text.sections.changes.title} theme={theme}>{text.sections.changes.body}</Section>
      <Section title={text.sections.law.title} theme={theme}>{text.sections.law.body}</Section>
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
