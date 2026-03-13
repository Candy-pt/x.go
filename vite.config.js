import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,              // port chạy dev server
    https: false,            // để chạy HTTP bình thường, đổi thành true nếu muốn HTTPS
    proxy: {                 // proxy API sang backend
      '/api': 'http://localhost:8000',
    },
    hmr: {                   // cấu hình Hot Module Reload
      host: 'localhost',
      port: 5173,
      protocol: 'ws',        // dùng ws cho HTTP, wss cho HTTPS
    },
  },
});