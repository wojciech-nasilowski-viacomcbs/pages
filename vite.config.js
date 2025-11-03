import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
        viteTest: './index-vite.html' // SPIKE: Test bundled version
      }
    }
  },
  server: {
    port: 3000,
    open: '/index-vite.html' // SPIKE: Open test version by default
  },
  // Optimize dependencies
  optimizeDeps: {
    include: []
  }
});
