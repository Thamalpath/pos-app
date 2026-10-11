import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Tailwind resolves its own config from `process.cwd()`, not from the CSS file
// being processed. Vite, however, locates *this* file by searching upward from
// the CSS file. The mismatch bites in a monorepo: running `vite` from the repo
// root finds this config but leaves Tailwind on the default theme, where the
// semantic tokens (bg-canvas, text-fg, ...) do not exist.
//
// Passing an absolute path makes token loading independent of the launch
// directory.
const here = path.dirname(fileURLToPath(import.meta.url));

export default {
  plugins: {
    tailwindcss: { config: path.join(here, 'tailwind.config.js') },
    autoprefixer: {}
  }
};