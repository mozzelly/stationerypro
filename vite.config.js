import { defineConfig } from 'vite';

export default defineConfig({
  base: '/stationerypro/', // Lazima iwe hivi
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});