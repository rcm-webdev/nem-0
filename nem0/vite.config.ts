import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      '/chat': 'http://localhost:8000',
      '/memories': 'http://localhost:8000',
      '/profile': 'http://localhost:8000',
      '/recommendations': 'http://localhost:8000',
      '/checkin': 'http://localhost:8000',
    },
  },
});
