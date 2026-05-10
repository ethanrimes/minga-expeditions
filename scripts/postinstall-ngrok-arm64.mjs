// Stub @expo/ngrok-bin-win32-arm64 so `expo start --tunnel` works on
// Windows-on-ARM. The official @expo/ngrok-bin package only ships
// optionalDependencies for win32-ia32 and win32-x64; on arm64 the resolver
// fails and ngrok throws "Platform not supported." We work around it by
// pointing the arm64 path at the win32-x64 binary, which Windows on ARM
// runs transparently via Prism emulation.
//
// Idempotent. Safe to re-run after every `npm install`.

import { existsSync, copyFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const isWindowsArm64 = process.platform === 'win32' && process.arch === 'arm64';
if (!isWindowsArm64) process.exit(0);

const root = dirname(new URL(import.meta.url).pathname.replace(/^\//, '')); // scripts/
const repo = join(root, '..');
const x64Dir = join(repo, 'node_modules', '@expo', 'ngrok-bin-win32-x64');
const arm64Dir = join(repo, 'node_modules', '@expo', 'ngrok-bin-win32-arm64');

if (!existsSync(join(x64Dir, 'ngrok.exe'))) {
  // x64 dep wasn't installed (probably ngrok feature not in use). Nothing to do.
  process.exit(0);
}

if (existsSync(join(arm64Dir, 'ngrok.exe'))) {
  // Already stubbed.
  process.exit(0);
}

mkdirSync(arm64Dir, { recursive: true });
copyFileSync(join(x64Dir, 'ngrok.exe'), join(arm64Dir, 'ngrok.exe'));
writeFileSync(
  join(arm64Dir, 'package.json'),
  JSON.stringify(
    {
      name: '@expo/ngrok-bin-win32-arm64',
      version: '2.3.41-arm64-stub',
      description: 'Local stub: copy of @expo/ngrok-bin-win32-x64 for Windows ARM64 via Prism.',
    },
    null,
    2,
  ),
);
console.log('postinstall: stubbed @expo/ngrok-bin-win32-arm64 from win32-x64');
