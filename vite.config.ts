import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // CRITICAL: Ensures assets load from the correct subfolder on GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // Removed minify: 'terser' to avoid dependency errors. 
    // Vite now uses the built-in esbuild minifier.
  },
});