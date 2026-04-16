import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTheme } from '@minga/theme';
import { NavBar } from './components/NavBar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { FeedPage } from './pages/FeedPage';
import { ExpeditionPage } from './pages/ExpeditionPage';
import { ProfilePage } from './pages/ProfilePage';
import { AuthPage } from './pages/AuthPage';
import { TrackPage } from './pages/TrackPage';
import { SettingsPage } from './pages/SettingsPage';
import { MapPage } from './pages/MapPage';

export function App() {
  const { theme } = useTheme();

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
          <Route path="/expeditions/:id" element={<ExpeditionPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/track" element={<TrackPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
