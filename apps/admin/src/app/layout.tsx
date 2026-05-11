import type { Metadata } from 'next';
import './globals.css';
import { getLocale } from '@/lib/i18n/server';

export const metadata: Metadata = {
  title: 'Minga Admin',
  description: 'Administra categorías, expediciones y proveedores de Minga Expeditions.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
