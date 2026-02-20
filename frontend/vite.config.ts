import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // tudo que vem de node_modules
          if (id.includes("node_modules")) {
            if (id.includes("react-router")) {
              return "router";
            }

            if (id.includes("framer-motion")) {
              return "motion";
            }

            if (id.includes("lucide-react")) {
              return "icons";
            }

            if (id.includes("@radix-ui")) {
              return "radix";
            }

            if (id.includes("react")) {
              return "react-vendor";
            }

            return "vendor";
          }
        },
      },
    },
  },
});