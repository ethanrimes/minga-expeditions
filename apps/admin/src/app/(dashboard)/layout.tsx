import Link from 'next/link';
import { LayoutGrid, ListTree, Mountain, Briefcase, Receipt, LogOut, CalendarDays, Mail } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { getT } from '@/lib/i18n/server';
import { LanguageToggle } from '@/components/LanguageToggle';
import { signOut } from '../login/actions';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const { t, locale } = await getT();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-60 shrink-0 bg-surface border-b md:border-b-0 md:border-r border-surface-border flex flex-col">
        <div className="p-5 border-b border-surface-border">
          <Link href="/" className="block">
            <div className="text-sm font-semibold tracking-wide text-primary">MINGA</div>
            <div className="text-xs text-ink-500">{t('sidebar.brandSub')}</div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 text-sm">
          <NavLink href="/" icon={<LayoutGrid size={16} />}>{t('sidebar.dashboard')}</NavLink>
          <NavLink href="/categories" icon={<ListTree size={16} />}>{t('sidebar.categories')}</NavLink>
          <NavLink href="/expeditions" icon={<Mountain size={16} />}>{t('sidebar.expeditions')}</NavLink>
          <NavLink href="/expeditions/calendar" icon={<CalendarDays size={16} />}>{t('sidebar.calendar')}</NavLink>
          <NavLink href="/vendor-proposals" icon={<Briefcase size={16} />}>{t('sidebar.vendorProposals')}</NavLink>
          <NavLink href="/orders" icon={<Receipt size={16} />}>{t('sidebar.orders')}</NavLink>
          <NavLink href="/comms" icon={<Mail size={16} />}>{t('sidebar.comms')}</NavLink>
        </nav>

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

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-md text-ink-700 hover:bg-surface-alt hover:text-ink-900"
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
