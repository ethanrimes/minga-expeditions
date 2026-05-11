import React from 'react';
import { useTheme } from '@minga/theme';

export function PrivacyPage() {
  const { theme } = useTheme();
  return (
    <article style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 96px', color: theme.text, lineHeight: 1.6 }}>
      <header style={{ marginBottom: 32 }}>
        <p style={{ color: theme.primary, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: 12 }}>
          Legal
        </p>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginTop: 8 }}>Privacy Policy</h1>
        <p style={{ color: theme.textMuted, marginTop: 12 }}>
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </header>

      <Section title="Overview" theme={theme}>
        Minga Expeditions ("Minga", "we", "us") is a proof-of-concept traveler community and
        activity-tracking app for Colombia. This policy explains what data we collect when you
        use the website, mobile-frame preview, or mobile app, and how we use it.
      </Section>

      <Section title="What we collect" theme={theme}>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li><strong>Account data</strong> — email, display name, profile photo. Collected when you sign up by email/password or via Facebook, Google, or Instagram login.</li>
          <li><strong>Activity data</strong> — GPS coordinates, distance, elevation, timestamps, photos you attach. Recorded only when you explicitly start a tracking session.</li>
          <li><strong>Booking data</strong> — name, email, WhatsApp phone, expedition selection, payment status. Only collected if you book a paid expedition.</li>
          <li><strong>Crash + error telemetry</strong> — stack traces, device model, OS version, app version. Used to fix bugs. Sent through Sentry.</li>
        </ul>
      </Section>

      <Section title="What we don't collect" theme={theme}>
        We do not run advertising trackers, do not sell or share data with third-party advertisers,
        and do not access your contacts, microphone, or camera outside of explicit user-initiated
        actions (taking a photo to attach to an activity).
      </Section>

      <Section title="Where your data lives" theme={theme}>
        Account and activity data are stored in Supabase (Postgres in AWS us-west-2). Payments are
        processed by Wompi (Colombia). Authentication via Facebook / Google / Instagram is handled
        through Supabase's auth gateway, which exchanges OAuth tokens with each provider on your
        behalf. We never see your provider passwords.
      </Section>

      <Section title="WhatsApp notifications" theme={theme}>
        If you book an expedition and supply a WhatsApp number, we send booking confirmations and
        trip-day reminders through the WhatsApp Business API. You may opt out at any time by
        replying STOP to any message, or by deleting your account.
      </Section>

      <Section title="Your rights" theme={theme}>
        You can request a copy of your data, correct any inaccuracies, or delete your account at
        any time. Email <a href="mailto:hello@minga.co" style={{ color: theme.primary }}>hello@minga.co</a> and
        we will respond within 30 days.
      </Section>

      <Section title="Cookies" theme={theme}>
        The website uses a single session cookie set by Supabase to keep you signed in. No
        third-party analytics or advertising cookies are set.
      </Section>

      <Section title="Children" theme={theme}>
        Minga is intended for travelers 18 years or older. We do not knowingly collect data from
        children under 13. If we learn we have inadvertently done so, we will delete the account
        and associated data on request.
      </Section>

      <Section title="Changes to this policy" theme={theme}>
        We may update this policy as the product evolves. The "last updated" date at the top
        reflects the most recent revision. Material changes will be announced via in-app banner
        or email to registered users.
      </Section>

      <Section title="Contact" theme={theme}>
        Questions about this policy or your data:&nbsp;
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
