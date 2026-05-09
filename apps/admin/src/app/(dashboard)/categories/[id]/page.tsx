import { notFound } from 'next/navigation';
import { fetchCategoryById } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CategoryForm } from '../CategoryForm';
import { updateCategoryAction } from '../actions';

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const category = await fetchCategoryById(supabase, id);
  if (!category) notFound();

  const action = updateCategoryAction.bind(null, id);

  return (
    <div>
      <h1 className="text-2xl font-bold">Edit category</h1>
      <p className="text-ink-500 mt-1 font-mono text-xs">{category.slug}</p>
      <div className="mt-8">
        <CategoryForm action={action} initial={category} submitLabel="Save changes" />
      </div>
    </div>
  );
}
