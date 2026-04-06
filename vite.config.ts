import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 3000,
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
});
