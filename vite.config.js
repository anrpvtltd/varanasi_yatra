import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5174,
    proxy: {
      '/public/partners': 'http://127.0.0.1:5001',
      '/public/leads': 'http://127.0.0.1:5001',
      '/api': 'http://127.0.0.1:5001',
      '/auth': 'http://127.0.0.1:5001',
      '/admin': {
        target: 'http://127.0.0.1:5001',
        bypass: (req) => {
          if (req.headers.accept && req.headers.accept.includes('text/html')) {
            return '/index.html';
          }
        }
      }
    }
  }
})
