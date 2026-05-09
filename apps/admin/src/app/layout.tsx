import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Minga Admin',
  description: 'Manage Minga Expeditions categories, expeditions, and vendors.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
