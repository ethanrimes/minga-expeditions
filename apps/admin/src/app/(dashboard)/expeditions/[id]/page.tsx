import { notFound } from 'next/navigation';
import { adminGetExpedition, fetchCategories } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ExpeditionForm } from '../ExpeditionForm';
import { updateExpeditionAction } from '../actions';

export default async function EditExpeditionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const [expedition, categories] = await Promise.all([
    adminGetExpedition(supabase, id),
    fetchCategories(supabase),
  ]);
  if (!expedition) notFound();

  const action = updateExpeditionAction.bind(null, id);

  return (
    <div>
      <h1 className="text-2xl font-bold">Edit expedition</h1>
      <p className="text-ink-500 mt-1 text-sm">{expedition.title}</p>
      <div className="mt-8">
        <ExpeditionForm
          action={action}
          categories={categories}
          initial={expedition}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
