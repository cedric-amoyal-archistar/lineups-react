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
    },
  },
})
