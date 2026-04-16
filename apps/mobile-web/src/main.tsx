import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@minga/theme';
import './supabase';
import { App } from './App';

const el = document.getElementById('root')!;
createRoot(el).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
