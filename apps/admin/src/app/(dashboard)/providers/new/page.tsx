import Link from 'next/link';
import { ProviderForm } from '../ProviderForm';

export default function NewProviderPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/providers" className="text-sm text-primary font-semibold">
        ← Back to providers
      </Link>
      <h1 className="text-2xl font-bold">New provider</h1>
      <ProviderForm initial={null} />
    </div>
  );
}
