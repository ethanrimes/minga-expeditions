import { fetchCategories } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ExpeditionForm } from '../ExpeditionForm';
import { createExpeditionAction } from '../actions';

export default async function NewExpeditionPage() {
  const supabase = await createSupabaseServerClient();
  const categories = await fetchCategories(supabase, { activeOnly: true });

  return (
    <div>
      <h1 className="text-2xl font-bold">New expedition</h1>
      <p className="text-ink-500 mt-1">Adds a new official Minga listing to the mobile feed.</p>
      <div className="mt-8">
        <ExpeditionForm
          action={createExpeditionAction}
          categories={categories}
          submitLabel="Create expedition"
        />
      </div>
    </div>
  );
}
