import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@hailin/core': path.resolve(__dirname, '../../packages/core/src'),
      '@hailin/cart': path.resolve(__dirname, '../../packages/cart/src'),
      '@hailin/order': path.resolve(__dirname, '../../packages/order/src'),
      '@hailin/member': path.resolve(__dirname, '../../packages/member/src'),
      '@hailin/payment': path.resolve(__dirname, '../../packages/payment/src'),
      '@hailin/promotion': path.resolve(__dirname, '../../packages/promotion/src'),
      '@hailin/hardware': path.resolve(__dirname, '../../packages/hardware/src'),
    },
  },
  server: {
    port: 5000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
