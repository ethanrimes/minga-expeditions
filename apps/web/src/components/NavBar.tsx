import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '@minga/theme';
import { supabase } from '../supabase';
import type { Session } from '@supabase/supabase-js';

export function NavBar() {
  const { theme } = useTheme();
  const nav = useNavigate();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const linkStyle: React.CSSProperties = {
    color: theme.text,
    fontWeight: 600,
    padding: '10px 14px',
    borderRadius: 8,
  };

  const activeStyle: React.CSSProperties = {
    color: theme.primary,
  };

  return (
    <header
      style={{
        background: theme.surface,
        borderBottom: `1px solid ${theme.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Logo color={theme.primary} />
          <span style={{ color: theme.text, fontWeight: 800, fontSize: 22, letterSpacing: -0.5 }}>
            minga<span style={{ color: theme.primary }}>.</span>
          </span>
        </Link>

        <nav style={{ display: 'flex', gap: 4, flex: 1 }}>
          <NavLink to="/expeditions" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>
            Expeditions
          </NavLink>
          <NavLink to="/track" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>
            Track
          </NavLink>
          <NavLink to="/profile" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>
            Profile
          </NavLink>
          <NavLink to="/settings" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>
            Settings
          </NavLink>
        </nav>

        {session ? (
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              nav('/');
            }}
            style={{
              background: 'transparent',
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: 999,
              padding: '10px 18px',
              fontWeight: 600,
            }}
          >
            Sign out
          </button>
        ) : (
          <Link
            to="/auth"
            style={{
              background: theme.primary,
              color: theme.onPrimary,
              borderRadius: 999,
              padding: '10px 20px',
              fontWeight: 700,
            }}
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

function Logo({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="30" fill={color} />
      <path d="M12 42 L22 24 L32 36 L42 18 L52 42 Z" fill="#fff" />
    </svg>
  );
}
