import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@minga/theme';
import { LanguageProvider } from '@minga/i18n';
import './supabase';
import { App } from './App';

const el = document.getElementById('root')!;
createRoot(el).render(
  <React.StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </LanguageProvider>
  </React.StrictMode>,
);
