import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev the browser talks only to Vite; /api is proxied to the Express backend (same-origin cookies).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': { target: process.env.VITE_API_TARGET || 'http://localhost:5000', changeOrigin: true } } },
});
