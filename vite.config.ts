import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/uefa-api': {
        target: 'https://match.uefa.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/uefa-api/, ''),
      },
      '/ligue1-api': {
        target: 'https://ma-api.ligue1.fr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ligue1-api/, ''),
      },
      '/pl-api': {
        target: 'https://sdp-prem-prod.premier-league-prod.pulselive.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pl-api/, ''),
      },
      '/fifa-api': {
        target: 'https://api.fifa.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/fifa-api/, ''),
      },
    },
  },
})
