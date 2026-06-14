import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendUrl = process.env.VITE_API_URL || 'http://backend:3000';

export default defineConfig({
  plugins: [react()],

  preview: {
    port: 4173,
    host: true,
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  server: {
    host: true,
    strictPort: true,
    allowedHosts: [".trycloudflare.com", "localhost"],
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        secure: false,
      },
    },
  },

  resolve: {
    alias: {
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks':      path.resolve(__dirname, './src/hooks'),
      '@context':    path.resolve(__dirname, './src/context'),
      '@pages':      path.resolve(__dirname, './src/pages'),
      '@services':   path.resolve(__dirname, './src/services'),
      '@styles':     path.resolve(__dirname, './src/styles'),
      '@assets':     path.resolve(__dirname, './src/assets'),
      '@helpers':    path.resolve(__dirname, './src/helpers'),
    },
  },
});
