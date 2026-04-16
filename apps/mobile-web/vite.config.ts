import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import path from 'node:path';

const pkg = (name: string) => fileURLToPath(new URL(`../../packages/${name}/src/index.ts`, import.meta.url));

// react-native-web lives in apps/mobile-web/node_modules (not hoisted because
// apps/mobile pins react-native at a conflicting version), so Vite can't find
// it via the normal resolver when imports come from packages/ui. Pin the alias
// to this app's node_modules copy.
const rnwPath = path.resolve(__dirname, 'node_modules/react-native-web');

export default defineConfig({
  plugins: [react()],
  define: {
    __DEV__: 'true',
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
  resolve: {
    alias: [
      { find: /^react-native$/, replacement: rnwPath },
      { find: /^react-native\/(.+)$/, replacement: `${rnwPath}/$1` },
      { find: '@minga/types', replacement: pkg('types') },
      { find: '@minga/supabase', replacement: pkg('supabase') },
      { find: '@minga/theme', replacement: pkg('theme') },
      { find: '@minga/logic', replacement: pkg('logic') },
      { find: '@minga/ui', replacement: pkg('ui') },
    ],
    extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  optimizeDeps: {
    include: ['react-native-web'],
  },
  server: {
    port: 5174,
    host: true,
    fs: {
      allow: [path.resolve(__dirname, '../..')],
    },
  },
});
