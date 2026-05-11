import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTheme } from '@minga/theme';
import { fetchUnacknowledgedCompletions } from '@minga/supabase';
import type { ParticipationWithSalida } from '@minga/types';
import { NavBar } from './components/NavBar';
import { Footer } from './components/Footer';
import { TripCompletionModal } from './components/TripCompletionModal';
import { supabase } from './supabase';
import { HomePage } from './pages/HomePage';
import { FeedPage } from './pages/FeedPage';
import { CalendarPage } from './pages/CalendarPage';
import { ExpeditionPage } from './pages/ExpeditionPage';
import { ProfilePage } from './pages/ProfilePage';
import { AuthPage } from './pages/AuthPage';
import { TrackPage } from './pages/TrackPage';
import { SettingsPage } from './pages/SettingsPage';
import { MapPage } from './pages/MapPage';
import { ActivityPage } from './pages/ActivityPage';
import { PartnersPage } from './pages/PartnersPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { DataDeletionPage } from './pages/DataDeletionPage';

export function App() {
  const { theme } = useTheme();
  const [pendingCompletions, setPendingCompletions] = useState<ParticipationWithSalida[]>([]);

  // Check for unacknowledged trip completions whenever the auth state changes.
  // The first one in the list is rendered as a popup; closing it pops the next.
  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchUnacknowledgedCompletions(supabase);
        setPendingCompletions(list);
      } catch (e) {
        console.warn('trip-completion check failed', e);
      }
    };
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange((evt) => {
      if (evt === 'SIGNED_IN' || evt === 'INITIAL_SESSION' || evt === 'TOKEN_REFRESHED') {
        void load();
      }
      if (evt === 'SIGNED_OUT') setPendingCompletions([]);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Mirror the active palette into CSS variables so plain CSS can reference it (body bg, scrollbars, etc.).
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--minga-bg', theme.background);
    root.style.setProperty('--minga-surface', theme.surface);
    root.style.setProperty('--minga-text', theme.text);
    root.style.setProperty('--minga-muted', theme.textMuted);
    root.style.setProperty('--minga-primary', theme.primary);
    root.style.setProperty('--minga-primary-hover', theme.primaryHover);
    root.style.setProperty('--minga-accent', theme.accent);
    root.style.setProperty('--minga-border', theme.border);
    root.style.setProperty('--minga-surface-alt', theme.surfaceAlt);
    document.body.style.background = theme.background;
    document.body.style.color = theme.text;
  }, [theme]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/expeditions" element={<FeedPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/expeditions/:id" element={<ExpeditionPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/activities/:id" element={<ActivityPage />} />
          <Route path="/track" element={<TrackPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/partners" element={<PartnersPage />} />
          <Route path="/orders/:id/success" element={<OrderSuccessPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/data-deletion" element={<DataDeletionPage />} />
        </Routes>
      </main>
      <Footer />
      {pendingCompletions[0] ? (
        <TripCompletionModal
          participation={pendingCompletions[0]}
          onClose={() => setPendingCompletions((q) => q.slice(1))}
        />
      ) : null}
    </div>
  );
}
