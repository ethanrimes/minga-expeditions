'use client';

import { useActionState } from 'react';
import { loginWithPassword, type LoginState } from './actions';

const initial: LoginState = {};

export function LoginForm({ initialError }: { initialError: string | null }) {
  const [state, formAction, isPending] = useActionState(loginWithPassword, initial);
  const error = state.error ?? initialError;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="field">
        <span className="field-label">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="field-input"
        />
      </label>
      <label className="field">
        <span className="field-label">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="field-input"
        />
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button type="submit" disabled={isPending} className="btn-primary mt-2">
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
