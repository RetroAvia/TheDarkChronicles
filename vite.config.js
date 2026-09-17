import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    sourcemap: false,
    assetsInlineLimit: 8192
  },
  server: {
    port: 5173,
    host: true
  }
});
