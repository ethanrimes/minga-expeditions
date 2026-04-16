import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const pkg = (name: string) => fileURLToPath(new URL(`../../packages/${name}/src/index.ts`, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@minga/types': pkg('types'),
      '@minga/supabase': pkg('supabase'),
      '@minga/theme': pkg('theme'),
      '@minga/logic': pkg('logic'),
      '@minga/i18n': pkg('i18n'),
    },
  },
  server: {
    port: 5173,
    host: true,
    strictPort: true,
  },
});
