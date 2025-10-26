import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Ensure consistent path resolution
      '@': path.resolve(__dirname, './src'),
      // Add explicit alias for Chatbot to ensure case sensitivity
      '@/components/Chatbot/Chatbot.jsx': path.resolve(__dirname, './src/components/Chatbot/Chatbot.jsx')
    }
  },
  server: {
    port: 5173,
    headers: process.env.NODE_ENV === 'production' ? {
      'Content-Security-Policy': [
        "default-src 'self';",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' 'strict-dynamic';",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
        "img-src 'self' data: blob:;",
        "connect-src 'self' http://localhost:5000 https://*.googleapis.com;",
        "font-src 'self' data: https://fonts.gstatic.com;",
        "frame-src 'self';",
        "object-src 'none'"
      ].join(' ')
    } : {
      'Content-Security-Policy': [
        "default-src 'self';",
        "script-src * 'unsafe-inline' 'unsafe-eval';",
        "style-src * 'unsafe-inline';",
        "img-src * data: blob:;",
        "connect-src *;",
        "font-src * data:;",
        "frame-src *;"
      ].join(' ')
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        }
      }
    },
    cors: {
      origin: 'http://localhost:5173',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    },
  },
  define: {
    'process.env': {}
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
});
