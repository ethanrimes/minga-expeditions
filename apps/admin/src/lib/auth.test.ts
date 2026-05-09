import { describe, it, expect, vi, beforeEach } from 'vitest';

// `vi.mock` is hoisted to the top of the file by vitest's transformer, so
// any closure variables it references must be created via `vi.hoisted()` to
// guarantee they exist at hoist time.
const state = vi.hoisted(() => {
  const redirectCalls: string[] = [];
  const redirect = (url: string) => {
    redirectCalls.push(url);
    // Real next/navigation.redirect throws a sentinel error so the calling
    // function short-circuits. We mirror that so requireAdmin() stops here.
    const e = new Error(`__REDIRECT__:${url}`);
    (e as Error & { digest?: string }).digest = `NEXT_REDIRECT;replace;${url};307`;
    throw e;
  };
  return {
    user: null as { id: string; email?: string } | null,
    profile: { data: null as unknown, error: null as unknown },
    redirect,
    redirectCalls,
  };
});

vi.mock('next/navigation', () => ({ redirect: state.redirect }));

vi.mock('./supabase/server', () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => state.profile,
        }),
      }),
    }),
  }),
}));

import { requireAdmin, getCurrentAdmin } from './auth';

beforeEach(() => {
  state.redirectCalls.length = 0;
  state.profile = { data: null, error: null };
  state.user = null;
});

describe('requireAdmin', () => {
  it('redirects to /login when not signed in', async () => {
    await expect(requireAdmin()).rejects.toThrow(/__REDIRECT__:\/login$/);
    expect(state.redirectCalls).toContain('/login');
  });

  it('redirects to /login?error=missing_profile when the profiles row is absent', async () => {
    state.user = { id: 'u1' };
    state.profile = { data: null, error: null };
    await expect(requireAdmin()).rejects.toThrow(/missing_profile/);
    expect(state.redirectCalls).toContain('/login?error=missing_profile');
  });

  it('redirects to /login?error=not_admin when the role is "user"', async () => {
    state.user = { id: 'u1', email: 'me@example.com' };
    state.profile = { data: { id: 'u1', role: 'user' }, error: null };
    await expect(requireAdmin()).rejects.toThrow(/not_admin/);
    expect(state.redirectCalls).toContain('/login?error=not_admin');
  });

  it('returns the session when the role is "admin"', async () => {
    state.user = { id: 'u1', email: 'me@example.com' };
    state.profile = { data: { id: 'u1', role: 'admin', display_name: 'Admin' }, error: null };
    const session = await requireAdmin();
    expect(session.userId).toBe('u1');
    expect(session.email).toBe('me@example.com');
    expect(state.redirectCalls).toHaveLength(0);
  });
});

describe('getCurrentAdmin', () => {
  it('returns null instead of redirecting when signed-out', async () => {
    expect(await getCurrentAdmin()).toBeNull();
    expect(state.redirectCalls).toHaveLength(0);
  });

  it('returns null for non-admin profiles (no redirect either)', async () => {
    state.user = { id: 'u1' };
    state.profile = { data: { id: 'u1', role: 'user' }, error: null };
    expect(await getCurrentAdmin()).toBeNull();
    expect(state.redirectCalls).toHaveLength(0);
  });

  it('returns the session for admins', async () => {
    state.user = { id: 'u1' };
    state.profile = { data: { id: 'u1', role: 'admin' }, error: null };
    const out = await getCurrentAdmin();
    expect(out?.userId).toBe('u1');
  });
});
