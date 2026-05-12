import Link from 'next/link';
import { fetchProviders } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ProvidersTable } from './ProvidersTable';

export default async function ProvidersDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; include_inactive?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const providers = await fetchProviders(supabase, {
    search: sp.q || undefined,
    vendorType: (sp.type as never) || undefined,
    includeInactive: sp.include_inactive === '1',
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Providers</h1>
          <p className="text-sm text-ink-500 mt-1 max-w-2xl">
            Filterable rolodex of the operators behind salidas. Promotes from vendor proposals or
            stand alone.
          </p>
        </div>
        <Link href="/providers/new" className="btn-primary text-sm">
          + New provider
        </Link>
      </header>

      <ProvidersTable providers={providers} initialSearch={sp.q ?? ''} initialType={sp.type ?? ''} />
    </div>
  );
}
