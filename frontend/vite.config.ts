import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,  // ← Change to 5173
    proxy: {
      '/api': {
        target: 'http://localhost:3000',  // ← Change to 3000 (backend port)
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',  // ← Change to 3000
        changeOrigin: true,
      },
      '/ws': {  // ← Add WebSocket proxy
        target: 'ws://localhost:3000',
        ws: true,
      },
    },
  },
})