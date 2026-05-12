import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchProvider } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ProviderForm } from '../ProviderForm';
import { deleteProviderAction } from '../actions';

export default async function EditProviderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const provider = await fetchProvider(supabase, id);
  if (!provider) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/providers" className="text-sm text-primary font-semibold">
        ← Back to providers
      </Link>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{provider.display_name}</h1>
        <form action={deleteProviderAction}>
          <input type="hidden" name="id" value={provider.id} />
          <button type="submit" className="btn-secondary text-xs text-danger">
            Delete provider
          </button>
        </form>
      </div>
      <ProviderForm initial={provider} />
    </div>
  );
}
