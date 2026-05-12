'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Briefcase,
  CalendarDays,
  LayoutGrid,
  ListTree,
  Mail,
  Mountain,
  Receipt,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';

interface Leaf {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface Group {
  label: string;
  icon: LucideIcon;
  items: Leaf[];
}

interface Labels {
  dashboard: string;
  groups: {
    expeditions: string;
    users: string;
    providers: string;
    communications: string;
  };
  items: {
    categories: string;
    itineraries: string;
    dates: string;
    insights: string;
    userProfiles: string;
    orders: string;
    propuestas: string;
    directory: string;
    communications: string;
  };
}

export function Sidebar({ labels }: { labels: Labels }) {
  const pathname = usePathname() ?? '/';

  const groups: Group[] = [
    {
      label: labels.groups.expeditions,
      icon: Mountain,
      items: [
        { href: '/categories', label: labels.items.categories, icon: ListTree },
        { href: '/expeditions', label: labels.items.itineraries, icon: Mountain },
        { href: '/expeditions/calendar', label: labels.items.dates, icon: CalendarDays },
      ],
    },
    {
      label: labels.groups.users,
      icon: Users,
      items: [
        { href: '/users/insights', label: labels.items.insights, icon: BarChart3 },
        { href: '/users/profiles', label: labels.items.userProfiles, icon: Users },
        { href: '/orders', label: labels.items.orders, icon: Receipt },
      ],
    },
    {
      label: labels.groups.providers,
      icon: Truck,
      items: [
        { href: '/vendor-proposals', label: labels.items.propuestas, icon: Briefcase },
        { href: '/providers', label: labels.items.directory, icon: Truck },
      ],
    },
    {
      label: labels.groups.communications,
      icon: Mail,
      items: [{ href: '/comms', label: labels.items.communications, icon: Mail }],
    },
  ];

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="flex-1 px-3 py-4 flex flex-col gap-4 text-sm overflow-y-auto" aria-label="Admin">
      <SidebarLink
        href="/"
        Icon={LayoutGrid}
        label={labels.dashboard}
        active={pathname === '/'}
      />

      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <div
            className="flex items-center gap-2 px-3 pt-2 pb-1 text-[11px] uppercase tracking-wider font-bold text-ink-500 select-none"
            aria-hidden={false}
          >
            <group.icon size={13} strokeWidth={2.4} />
            <span>{group.label}</span>
          </div>
          {group.items.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              Icon={item.icon}
              label={item.label}
              active={isActive(item.href)}
              indented
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

function SidebarLink({
  href,
  Icon,
  label,
  active,
  indented = false,
}: {
  href: string;
  Icon: LucideIcon;
  label: string;
  active: boolean;
  indented?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={[
        'flex items-center gap-2 rounded-md transition-colors',
        indented ? 'pl-6 pr-3 py-1.5' : 'px-3 py-2',
        active
          ? 'bg-primary/10 text-primary font-semibold'
          : 'text-ink-700 hover:bg-surface-alt hover:text-ink-900',
      ].join(' ')}
    >
      <Icon size={14} strokeWidth={2} />
      <span>{label}</span>
    </Link>
  );
}
