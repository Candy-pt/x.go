import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'


export default defineConfig({
   plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Quản lý Xưởng Gỗ X-Go',
        short_name: 'X-Go',
        description: 'Hệ thống quản lý sản xuất xưởng gỗ',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,             
    https: false,            
    proxy: {                
      '/api': 'https://xgob-production.up.railway.app',
    },
    hmr: {                   
      host: 'localhost',
      port: 5173,
      protocol: 'ws',       
    },
  },
});
