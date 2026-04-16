import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@minga/theme';
import { LanguageProvider } from '@minga/i18n';
import './supabase';
import './styles.css';
import { App } from './App';

const el = document.getElementById('root')!;
createRoot(el).render(
  <React.StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </LanguageProvider>
  </React.StrictMode>,
);
