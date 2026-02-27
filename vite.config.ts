import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "vue": "vue/dist/vue.esm-bundler.js"
    }
  },
  server: {
    port: 5173,
    watch: {
      // ignore editor metadata, git, build artifacts and Vite cache to avoid spurious HMR
      ignored: ['**/.git/**', '**/.vscode/**', '**/.idea/**', '**/node_modules/**', '**/.vite/**', '**/dist/**', '**/.cache/**']
    },
    // disable HMR while diagnosing rapid reloads; set to true/overlay later if desired
    hmr: false,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8088",
        changeOrigin: true,
        secure: false,
        ws: true
      },
      "/health": {
        target: "http://127.0.0.1:8088",
        changeOrigin: true,
        secure: false
      },
      "/exports": {
        target: "http://127.0.0.1:8088",
        changeOrigin: true,
        secure: false
      }
    }
  }
});
