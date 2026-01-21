import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            const parts = id.toString().split(/[\\/]node_modules[\\/]/);
            if (parts.length > 1) {
              const pathParts = parts[parts.length - 1].split(/[\\/]/);
              if (pathParts[0].startsWith("@")) {
                return `${pathParts[0]}/${pathParts[1]}`;
              }
              return pathParts[0];
            }
          }
        },
      },
    },
  },
});
