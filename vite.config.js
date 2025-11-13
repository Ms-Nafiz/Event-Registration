import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://event.cclcatv.com', // তোমার Laravel API URL
        changeOrigin: true,
        secure: true,
      },
      '/sanctum': {
        target: 'https://event.cclcatv.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
