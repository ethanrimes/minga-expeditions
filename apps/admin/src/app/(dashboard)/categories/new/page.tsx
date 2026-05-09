import { CategoryForm } from '../CategoryForm';
import { createCategoryAction } from '../actions';

export default function NewCategoryPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">New category</h1>
      <p className="text-ink-500 mt-1">Adds a category that mobile users can filter expeditions by.</p>
      <div className="mt-8">
        <CategoryForm action={createCategoryAction} submitLabel="Create category" />
      </div>
    </div>
  );
}
