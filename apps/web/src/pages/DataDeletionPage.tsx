import React from 'react';
import { useTheme } from '@minga/theme';

export function DataDeletionPage() {
  const { theme } = useTheme();
  return (
    <article style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 96px', color: theme.text, lineHeight: 1.6 }}>
      <header style={{ marginBottom: 32 }}>
        <p style={{ color: theme.primary, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: 12 }}>
          Legal
        </p>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginTop: 8 }}>Data Deletion</h1>
        <p style={{ color: theme.textMuted, marginTop: 12 }}>
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </header>

      <Section title="Your right to delete" theme={theme}>
        You can delete your Minga Expeditions account and all associated personal
        data at any time. This page explains how, what gets removed, and what (if
        anything) we are required to retain.
      </Section>

      <Section title="Self-service from inside the app" theme={theme}>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li>Sign in at <a href="/auth" style={{ color: theme.primary }}>minga-expeditions-web.vercel.app/auth</a></li>
          <li>Open <a href="/settings" style={{ color: theme.primary }}>Settings</a></li>
          <li>Scroll to <strong>Delete account</strong></li>
          <li>Confirm. Deletion is immediate and irreversible.</li>
        </ol>
      </Section>

      <Section title="By email" theme={theme}>
        If you can't access the app for any reason (lost password, lost device,
        provider issue), email <a href="mailto:hello@minga.co" style={{ color: theme.primary }}>hello@minga.co</a> from
        the address tied to your account, with subject line <code>Delete my account</code>.
        We will verify your identity and remove your data within 30 days.
      </Section>

      <Section title="If you signed in via Facebook, Google, or Instagram" theme={theme}>
        Revoking the Minga app's permission inside your social provider's
        settings <em>does not</em> automatically delete your Minga account —
        only future sign-ins. To fully delete, use the in-app flow above or
        email us. Provider-side revocation links:
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>Facebook: <a href="https://www.facebook.com/settings?tab=applications" style={{ color: theme.primary }}>facebook.com/settings?tab=applications</a></li>
          <li>Instagram: <a href="https://www.instagram.com/accounts/manage_access/" style={{ color: theme.primary }}>instagram.com/accounts/manage_access</a></li>
          <li>Google: <a href="https://myaccount.google.com/permissions" style={{ color: theme.primary }}>myaccount.google.com/permissions</a></li>
        </ul>
      </Section>

      <Section title="What gets deleted" theme={theme}>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>Your profile (display name, avatar, bio, country)</li>
          <li>Every expedition you authored</li>
          <li>Every activity, GPS track, and attached photo</li>
          <li>Every comment, like, and rating you posted</li>
          <li>Crash and error telemetry tied to your user ID in Sentry</li>
          <li>WhatsApp opt-in records</li>
        </ul>
      </Section>

      <Section title="What we retain (and why)" theme={theme}>
        Colombian law and standard financial-record retention require us to
        keep a minimal subset of data, redacted of direct identifiers where
        possible:
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li><strong>Payment receipts</strong> tied to bookings you made (your name + transaction amount + date) — retained for 5 years per DIAN tax record requirements</li>
          <li><strong>Anonymized usage metrics</strong> (aggregate counters with no link back to you) — retained indefinitely</li>
        </ul>
        Everything else is hard-deleted from our database within 30 days. Daily
        Postgres backups are aged out within 7 days, so your record fully
        disappears within that window.
      </Section>

      <Section title="Timeline" theme={theme}>
        Most deletions complete within a few minutes (in-app flow) or within
        24 hours (email request). The 30-day window is the upper bound for
        edge cases. Backups containing your data are purged within 7 days
        of the deletion request.
      </Section>

      <Section title="Questions" theme={theme}>
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
