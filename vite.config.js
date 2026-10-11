import { defineConfig } from 'vite';

export default defineConfig({
  base: './',  // <-- BADILISHA HII: Tumia relative path
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    hmr: {
      overlay: false
    }
  }
});