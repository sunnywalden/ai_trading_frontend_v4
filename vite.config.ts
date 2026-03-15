import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

function manualChunks(id: string) {
  if (!id.includes('node_modules')) {
    return undefined;
  }

  if (
    id.includes('/vue/')
    || id.includes('/vue-router/')
    || id.includes('/pinia/')
    || id.includes('/vue-i18n/')
  ) {
    return 'vendor-vue-core';
  }

  if (id.includes('/echarts/')) {
    return 'vendor-echarts';
  }

  if (id.includes('/element-plus/') || id.includes('/@element-plus/')) {
    return 'vendor-element-plus';
  }

  if (id.includes('/axios/')) {
    return 'vendor-axios';
  }

  return 'vendor-misc';
}

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      vue: 'vue/dist/vue.esm-bundler.js'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
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
      '/api': {
        target: 'http://127.0.0.1:8088',
        changeOrigin: true,
        secure: false,
        // 前端业务 WebSocket 已改为直连后端，不再通过 Vite 代理转发
        // 关闭 ws 代理可避免开发时终端出现 `[vite] ws proxy error` 噪音
        ws: false
      },
      '/health': {
        target: 'http://127.0.0.1:8088',
        changeOrigin: true,
        secure: false
      },
      '/exports': {
        target: 'http://127.0.0.1:8088',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
