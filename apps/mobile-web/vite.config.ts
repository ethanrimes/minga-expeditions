import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const pkg = (name: string) => fileURLToPath(new URL(`../../packages/${name}/src/index.ts`, import.meta.url));

// Locate a node_modules package directory without using require.resolve(`${pkg}/package.json`),
// which fails on packages that don't list ./package.json in their `exports` field
// (e.g. lucide-react-native >= 0.5).
const here = path.dirname(fileURLToPath(import.meta.url));
function findPkgDir(name: string): string {
  const candidates = [
    path.resolve(here, 'node_modules', name),
    path.resolve(here, '../..', 'node_modules', name),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'package.json'))) return c;
  }
  throw new Error(`Could not locate ${name} in node_modules`);
}

const rnwPath = findPkgDir('react-native-web');
const lucidePath = findPkgDir('lucide-react-native');
const rnsvgPath = findPkgDir('react-native-svg');

export default defineConfig({
  plugins: [react()],
  define: {
    __DEV__: 'true',
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
  resolve: {
    alias: [
      // react-native-svg's Fabric files import this RN-internal path; stub on web.
      {
        find: /^react-native\/Libraries\/Utilities\/codegenNativeComponent$/,
        replacement: path.resolve(here, 'src/codegenNativeComponentStub.js'),
      },
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
    esbuildOptions: {
      // react-native-svg ships .web.js shims for index/ReactNativeSVG/elements
      // that bypass the Fabric/TurboModule-only files. Make esbuild's prebundle
      // pass prefer them, mirroring the resolve.extensions order above.
      resolveExtensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.json'],
    },
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
