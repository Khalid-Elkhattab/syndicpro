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
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'react';
          if (id.includes('node_modules/react-router-dom/')) return 'router';
          if (id.includes('node_modules/@tanstack/react-query/')) return 'query';
          if (id.includes('node_modules/recharts/')) return 'charts';
          if (id.includes('node_modules/framer-motion/')) return 'motion';
          if (id.includes('node_modules/date-fns/') || id.includes('node_modules/zustand/') || id.includes('node_modules/axios/')) return 'utils';
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
