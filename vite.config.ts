import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// Frontend source lives in web/; the build output goes to dist/ at the repo root,
// which `npm run deploy:web` hands to `wrangler pages deploy`.
//
// The demo (`npm run demo` / `npm run build:demo`) is instead deployed to GitHub
// Pages as a project site, which serves from /<repo-name>/.
const DEMO = process.env.VITE_DEMO === 'true';

// web/src/config.js is per-adopter and gitignored. In demo mode we alias every
// `config.js` import to the committed `config.example.js` template, so the demo
// runs without a personal config (and without clobbering one that exists).
const demoConfig = fileURLToPath(new URL('./web/src/config.example.js', import.meta.url));

export default defineConfig({
  root: 'web',
  base: DEMO ? '/Sluice/' : '/',
  resolve: {
    alias: DEMO ? [{ find: /(?:\.\.?\/)+config\.js$/, replacement: demoConfig }] : [],
  },
  plugins: [preact()],
  css: {
    preprocessorOptions: {
      scss: {
        // Bulma 1.x's Sass source trips several Dart Sass deprecation warnings
        // (if(), @import, global builtins…). quietDeps silences warnings from
        // dependencies (node_modules) while still surfacing them for our own SCSS.
        quietDeps: true,
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 8123,
    strictPort: true,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
