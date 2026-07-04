import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// Frontend source lives in web/; the build output goes to dist/ at the repo root,
// which `npm run deploy:web` hands to `wrangler pages deploy`.
export default defineConfig({
  root: 'web',
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
