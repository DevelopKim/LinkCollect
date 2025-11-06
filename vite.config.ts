import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json' with { type: 'json' };

export default defineConfig({
  plugins: [
    crx({ manifest }),
  ],
  base: './',
  build: {
    outDir: 'dist',
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
});
