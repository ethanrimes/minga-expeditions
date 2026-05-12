import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { getT } from '@/lib/i18n/server';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Sidebar } from '@/components/Sidebar';
import { signOut } from '../login/actions';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const { t, locale } = await getT();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-64 shrink-0 bg-surface border-b md:border-b-0 md:border-r border-surface-border flex flex-col">
        <div className="p-5 border-b border-surface-border">
          <Link href="/" className="block">
            <div className="text-sm font-semibold tracking-wide text-primary">MINGA</div>
            <div className="text-xs text-ink-500">{t('sidebar.brandSub')}</div>
          </Link>
        </div>

        <Sidebar
          labels={{
            dashboard: t('sidebar.dashboard'),
            groups: {
              expeditions: t('sidebar.group.expeditions'),
              users: t('sidebar.group.users'),
              providers: t('sidebar.group.providers'),
              communications: t('sidebar.group.communications'),
            },
            items: {
              categories: t('sidebar.item.categories'),
              itineraries: t('sidebar.item.itineraries'),
              dates: t('sidebar.item.dates'),
              insights: t('sidebar.item.insights'),
              userProfiles: t('sidebar.item.userProfiles'),
              orders: t('sidebar.item.orders'),
              propuestas: t('sidebar.item.propuestas'),
              directory: t('sidebar.item.directory'),
              communications: t('sidebar.item.communications'),
            },
          }}
        />

        <div className="border-t border-surface-border">
          <LanguageToggle current={locale} />
        </div>

        <form action={signOut} className="p-3 border-t border-surface-border">
          <div className="px-2 pb-2 text-xs text-ink-500 truncate">
            {session.profile.display_name}
            <div className="text-ink-300">{session.email}</div>
          </div>
          <button type="submit" className="btn-secondary w-full text-xs">
            <LogOut size={14} /> {t('sidebar.signOut')}
          </button>
        </form>
      </aside>

      <main className="flex-1 p-6 md:p-10 max-w-6xl">{children}</main>
    </div>
  );
}
