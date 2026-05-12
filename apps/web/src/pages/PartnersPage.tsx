import React, { useState } from 'react';
import { useTheme } from '@minga/theme';
import { useT } from '@minga/i18n';
import { submitVendorProposal } from '@minga/supabase';
import type { VendorType } from '@minga/types';
import { supabase } from '../supabase';

// Public submission form. No auth required — vendor_proposals RLS allows anon
// inserts. The admin reviews submissions in apps/admin/vendor-proposals.

const VENDOR_TYPE_VALUES: VendorType[] = [
  'full_experience',
  'transportation',
  'lodging',
  'guide',
  'food',
  'other',
];

export function PartnersPage() {
  const { theme } = useTheme();
  const { t } = useT();
  const [vendor_type, setVendorType] = useState<VendorType>('full_experience');
  const [vendor_name, setVendorName] = useState('');
  const [contact_email, setEmail] = useState('');
  const [contact_phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pricing_notes, setPricingNotes] = useState('');
  const [attachments_url, setAttachmentsUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!contact_email.trim() && !contact_phone.trim()) {
      setError(t('partners.errorContactRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await submitVendorProposal(supabase, {
        vendor_name: vendor_name.trim(),
        contact_email: contact_email.trim() || null,
        contact_phone: contact_phone.trim() || null,
        vendor_type,
        region: region.trim() || null,
        title: title.trim(),
        description: description.trim(),
        pricing_notes: pricing_notes.trim() || null,
        attachments_url: attachments_url.trim() || null,
      });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px' }}>
        <h1 style={{ color: theme.text, fontSize: 32, fontWeight: 800 }}>{t('partners.thanksTitle')}</h1>
        <p style={{ color: theme.textMuted, marginTop: 12, lineHeight: 1.6 }}>
          {t('partners.thanksBody')}
        </p>
        <button
          onClick={() => {
            setDone(false);
            setVendorName('');
            setEmail('');
            setPhone('');
            setRegion('');
            setTitle('');
            setDescription('');
            setPricingNotes('');
            setAttachmentsUrl('');
          }}
          style={{
            marginTop: 24,
            background: theme.primary,
            color: theme.onPrimary,
            border: 'none',
            borderRadius: 999,
            padding: '12px 22px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {t('partners.submitAnother')}
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 96px' }}>
      <header style={{ marginBottom: 32 }}>
        <p style={{ color: theme.primary, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: 12 }}>
          {t('partners.eyebrow')}
        </p>
        <h1 style={{ color: theme.text, fontSize: 36, fontWeight: 800, marginTop: 8 }}>
          {t('partners.title')}
        </h1>
        <p style={{ color: theme.textMuted, marginTop: 12, lineHeight: 1.6 }}>
          {t('partners.intro')}
        </p>
      </header>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Field label={t('partners.fieldOfferType')} theme={theme}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {VENDOR_TYPE_VALUES.map((value) => {
              const selected = vendor_type === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setVendorType(value)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    background: selected ? theme.primary : theme.surface,
                    color: selected ? theme.onPrimary : theme.text,
                    border: `1px solid ${selected ? theme.primary : theme.border}`,
                    borderRadius: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <div>{t(`partners.vendorType.${value}` as const)}</div>
                  <div style={{ fontWeight: 400, fontSize: 12, marginTop: 4, opacity: 0.85 }}>
                    {t(`partners.vendorHint.${value}` as const)}
                  </div>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label={t('partners.fieldBusinessName')} theme={theme}>
          <Input value={vendor_name} onChange={setVendorName} required theme={theme} />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label={t('partners.fieldEmail')} theme={theme}>
            <Input value={contact_email} onChange={setEmail} type="email" theme={theme} />
          </Field>
          <Field label={t('partners.fieldPhone')} theme={theme}>
            <Input
              value={contact_phone}
              onChange={setPhone}
              type="tel"
              theme={theme}
              placeholder={t('partners.fieldPhonePlaceholder')}
            />
          </Field>
        </div>
        <p style={{ color: theme.textMuted, fontSize: 12, marginTop: -12 }}>
          {t('partners.fieldContactNote')}
        </p>

        <Field label={t('partners.fieldRegion')} theme={theme}>
          <Input
            value={region}
            onChange={setRegion}
            theme={theme}
            placeholder={t('partners.fieldRegionPlaceholder')}
          />
        </Field>

        <Field label={t('partners.fieldTitle')} theme={theme}>
          <Input
            value={title}
            onChange={setTitle}
            required
            theme={theme}
            placeholder={t('partners.fieldTitlePlaceholder')}
          />
        </Field>

        <Field label={t('partners.fieldDescription')} theme={theme}>
          <Textarea value={description} onChange={setDescription} required theme={theme} rows={6} />
        </Field>

        <Field label={t('partners.fieldPricingNotes')} theme={theme}>
          <Textarea
            value={pricing_notes}
            onChange={setPricingNotes}
            theme={theme}
            rows={3}
            placeholder={t('partners.fieldPricingPlaceholder')}
          />
        </Field>

        <Field label={t('partners.fieldAttachments')} theme={theme}>
          <Input value={attachments_url} onChange={setAttachmentsUrl} type="url" theme={theme} placeholder="https://…" />
        </Field>

        {error ? (
          <div style={{ color: theme.danger, fontSize: 14 }}>{error}</div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          style={{
            background: theme.primary,
            color: theme.onPrimary,
            border: 'none',
            borderRadius: 999,
            padding: '14px 24px',
            fontWeight: 700,
            fontSize: 16,
            cursor: submitting ? 'wait' : 'pointer',
            alignSelf: 'flex-start',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? t('partners.submitting') : t('partners.submit')}
        </button>
      </form>
    </div>
  );
}

function Field({ label, theme, children }: { label: string; theme: ReturnType<typeof useTheme>['theme']; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ color: theme.text, fontSize: 13, fontWeight: 700, letterSpacing: 0.3 }}>{label}</span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  required,
  type = 'text',
  placeholder,
  theme,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      type={type}
      placeholder={placeholder}
      style={{
        background: theme.surface,
        color: theme.text,
        border: `1px solid ${theme.border}`,
        borderRadius: 10,
        padding: '12px 14px',
        fontSize: 15,
      }}
    />
  );
}

function Textarea({
  value,
  onChange,
  required,
  rows = 4,
  placeholder,
  theme,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  rows?: number;
  placeholder?: string;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      rows={rows}
      placeholder={placeholder}
      style={{
        background: theme.surface,
        color: theme.text,
        border: `1px solid ${theme.border}`,
        borderRadius: 10,
        padding: '12px 14px',
        fontSize: 15,
        resize: 'vertical',
        fontFamily: 'inherit',
      }}
    />
  );
}
