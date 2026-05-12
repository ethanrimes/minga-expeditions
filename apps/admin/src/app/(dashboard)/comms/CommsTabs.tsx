'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Tab {
  href: string;
  label: string;
  description: string;
}

export function CommsTabs({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();
  return (
    <nav className="border-b border-surface-border flex flex-wrap gap-1" aria-label="Communications tabs">
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={[
              'px-4 py-2 text-sm font-semibold rounded-t-md -mb-px border-b-2',
              active
                ? 'text-primary border-primary bg-surface-alt'
                : 'text-ink-500 hover:text-ink-700 border-transparent',
            ].join(' ')}
          >
            <span>{tab.label}</span>
            <span className="ml-2 text-xs font-normal text-ink-500 hidden md:inline">{tab.description}</span>
          </Link>
        );
      })}
    </nav>
  );
}
