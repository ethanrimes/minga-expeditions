import { redirect } from 'next/navigation';
import { LoginForm } from './LoginForm';
import { getCurrentAdmin } from '@/lib/auth';
import { getT } from '@/lib/i18n/server';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const existing = await getCurrentAdmin();
  if (existing) redirect('/');

  const { t } = await getT();
  const params = await searchParams;
  const errorMessages: Record<string, string> = {
    missing_profile: t('login.error.missingProfile'),
    not_admin: t('login.error.notAdmin'),
  };
  const initialError = params.error ? errorMessages[params.error] ?? null : null;

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm card">
        <header className="mb-6">
          <h1 className="text-xl font-bold">{t('login.title')}</h1>
          <p className="mt-1 text-sm text-ink-500">{t('login.subtitle')}</p>
        </header>
        <LoginForm
          initialError={initialError}
          labels={{
            email: t('login.email'),
            password: t('login.password'),
            signIn: t('login.signIn'),
            signingIn: t('login.signingIn'),
          }}
        />
      </div>
    </main>
  );
}
