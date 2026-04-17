import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

const pkg = (name: string) => fileURLToPath(new URL(`../../packages/${name}/src/index.ts`, import.meta.url));

// react-native-web might live in apps/mobile-web/node_modules or get hoisted
// to the monorepo root (npm decides based on version peer compatibility).
// Use createRequire from this file's location to resolve wherever it is.
const rnwPkgJson = require.resolve('react-native-web/package.json');
const rnwPath = path.dirname(rnwPkgJson);

// lucide-react-native + react-native-svg may be installed per-app instead of
// hoisted to the monorepo root. Resolve from this file's location so imports
// inside packages/ui (which has no local node_modules) still find them.
const lucidePath = path.dirname(require.resolve('lucide-react-native/package.json'));
const rnsvgPath = path.dirname(require.resolve('react-native-svg/package.json'));

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
      { find: /^lucide-react-native$/, replacement: lucidePath },
      { find: /^lucide-react-native\/(.+)$/, replacement: `${lucidePath}/$1` },
      { find: /^react-native-svg$/, replacement: rnsvgPath },
      { find: /^react-native-svg\/(.+)$/, replacement: `${rnsvgPath}/$1` },
      { find: '@minga/types', replacement: pkg('types') },
      { find: '@minga/supabase', replacement: pkg('supabase') },
      { find: '@minga/theme', replacement: pkg('theme') },
      { find: '@minga/logic', replacement: pkg('logic') },
      { find: '@minga/ui', replacement: pkg('ui') },
      { find: '@minga/i18n', replacement: pkg('i18n') },
    ],
    extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.json'],
    // react-native-web expects a single React copy across all consumers; dedupe in case
    // a stray version sneaks in through a transitive dep.
    dedupe: ['react', 'react-dom', 'react-native-web'],
  },
  optimizeDeps: {
    include: ['react-native-web', 'lucide-react-native', 'react-native-svg'],
  },
  server: {
    port: 5174,
    host: true,
    strictPort: true,
    fs: {
      allow: [path.resolve(__dirname, '../..')],
    },
  },
});
