import React from 'react';
import { useTheme } from '@minga/theme';

export function TermsPage() {
  const { theme } = useTheme();
  return (
    <article style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 96px', color: theme.text, lineHeight: 1.6 }}>
      <header style={{ marginBottom: 32 }}>
        <p style={{ color: theme.primary, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: 12 }}>
          Legal
        </p>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginTop: 8 }}>Terms of Service</h1>
        <p style={{ color: theme.textMuted, marginTop: 12 }}>
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </header>

      <Section title="Acceptance" theme={theme}>
        By creating an account or using Minga Expeditions ("the Service") you agree to these
        Terms. If you do not agree, do not use the Service.
      </Section>

      <Section title="The Service" theme={theme}>
        Minga is a proof-of-concept platform for discovering, booking, and recording
        expeditions in Colombia. The Service is provided as-is during the development phase;
        features may change without notice while we iterate.
      </Section>

      <Section title="Your account" theme={theme}>
        You are responsible for keeping your account credentials secure. You may sign in with
        email + password or with a Facebook, Google, or Instagram account. You may delete your
        account at any time from the Settings page or by emailing&nbsp;
        <a href="mailto:hello@minga.co" style={{ color: theme.primary }}>hello@minga.co</a>.
      </Section>

      <Section title="User content" theme={theme}>
        You retain ownership of expeditions you publish, activities you track, photos you upload,
        and comments you write. By posting content on the Service you grant Minga a non-exclusive,
        worldwide license to display that content within the Service to other users.
      </Section>

      <Section title="Expedition listings + bookings" theme={theme}>
        Some expeditions on Minga are paid. Bookings are processed by Wompi; the relationship for
        the trip itself is between you and the expedition organizer. Minga facilitates discovery
        and payment routing but is not responsible for the conduct, safety, or quality of any
        third-party expedition. Always verify operator credentials and insurance for paid
        activities.
      </Section>

      <Section title="Acceptable use" theme={theme}>
        Do not use the Service to:
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>publish false expedition information, fake activity tracks, or misleading prices</li>
          <li>harass, threaten, or impersonate other users</li>
          <li>circumvent the platform's payment flow</li>
          <li>scrape data or attempt to access the database directly</li>
          <li>reverse-engineer the Service except as permitted by applicable law</li>
        </ul>
        We may suspend or terminate accounts that violate these rules.
      </Section>

      <Section title="Payments + refunds" theme={theme}>
        All charges are made in Colombian pesos (COP) unless explicitly noted. Refund eligibility
        depends on the policy of the expedition operator and the timing of cancellation. Contact
        the operator directly, copying&nbsp;
        <a href="mailto:hello@minga.co" style={{ color: theme.primary }}>hello@minga.co</a>, to
        request a refund.
      </Section>

      <Section title="Liability + risk" theme={theme}>
        Outdoor activities carry inherent risk. You participate in any tracked or booked
        expedition at your own risk and are responsible for your own safety, fitness, equipment,
        and insurance. Minga disclaims liability for injury, loss, or damage arising from
        participation in any activity discovered through the Service, to the maximum extent
        permitted by Colombian law.
      </Section>

      <Section title="Termination" theme={theme}>
        You may stop using the Service at any time. We may terminate or suspend accounts that
        violate these Terms or that we reasonably believe pose a risk to other users or the
        platform.
      </Section>

      <Section title="Changes to these Terms" theme={theme}>
        We may revise these Terms as the Service evolves. Material changes will be announced via
        in-app banner or email to registered users. Continued use of the Service after the
        revised Terms take effect constitutes acceptance.
      </Section>

      <Section title="Governing law" theme={theme}>
        These Terms are governed by the laws of the Republic of Colombia. Disputes will be
        resolved in the courts of Bogotá D.C.
      </Section>

      <Section title="Contact" theme={theme}>
        Questions about these Terms:&nbsp;
        <a href="mailto:hello@minga.co" style={{ color: theme.primary }}>hello@minga.co</a>
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
