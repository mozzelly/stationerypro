import { defineConfig } from 'vite';

export default defineConfig({
  // HII NDIO MUHIMU KWA GITHUB PAGES
  base: '/stationerypro/',
  
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