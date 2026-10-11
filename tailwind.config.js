import path from 'node:path';
import { fileURLToPath } from 'node:url';
import uiPreset from '@pos/ui/tailwind-preset';

// Tailwind resolves `content` globs against process.cwd(), not against this
// config. In a monorepo that means launching Vite from the repo root silently
// matches nothing, producing an unstyled app with no visible error. Anchoring
// the globs to this file keeps detection identical from any directory.
const configDir = path.dirname(fileURLToPath(import.meta.url));
const glob = pattern => path.resolve(configDir, pattern).replace(/\\/g, '/');

// The shared preset owns the palette, fonts and radii.
export default {
  presets: [uiPreset],
  content: [
    glob('index.html'),
    glob('src/**/*.{js,ts,jsx,tsx}'),
    glob('packages/ui/src/**/*.{js,ts,jsx,tsx}')
  ]
};