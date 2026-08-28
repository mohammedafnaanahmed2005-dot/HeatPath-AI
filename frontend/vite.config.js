import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'leaflet': ['leaflet', 'react-leaflet'],
          'charts': ['chart.js', 'react-chartjs-2'],
          'icons': ['lucide-react']
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '^/api(?:/|$)': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      }
    }
  }
});
