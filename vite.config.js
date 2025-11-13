import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://event.cclcatv.com',
        changeOrigin: true,
        secure: true,
        // 🔹 কিছু Laravel setup এ pathRewrite দরকার হয় না,
        // কিন্তু future-proof রাখতে নিচের লাইন safe:
        rewrite: path => path.replace(/^\/api/, '/api'),
      },
      '/sanctum': {
        target: 'https://event.cclcatv.com',
        changeOrigin: true,
        secure: true,
        rewrite: path => path.replace(/^\/sanctum/, '/sanctum'),
      },
    },
  },
})
