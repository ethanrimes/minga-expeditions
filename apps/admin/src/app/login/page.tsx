import { redirect } from 'next/navigation';
import { LoginForm } from './LoginForm';
import { getCurrentAdmin } from '@/lib/auth';

const ERROR_MESSAGES: Record<string, string> = {
  missing_profile: 'Your account has no Minga profile yet — contact an existing admin.',
  not_admin: 'This account is not authorized for the admin dashboard.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const existing = await getCurrentAdmin();
  if (existing) redirect('/');

  const params = await searchParams;
  const initialError = params.error ? ERROR_MESSAGES[params.error] ?? null : null;

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm card">
        <header className="mb-6">
          <h1 className="text-xl font-bold">Minga Admin</h1>
          <p className="mt-1 text-sm text-ink-500">Sign in with an admin account.</p>
        </header>
        <LoginForm initialError={initialError} />
      </div>
    </main>
  );
}
