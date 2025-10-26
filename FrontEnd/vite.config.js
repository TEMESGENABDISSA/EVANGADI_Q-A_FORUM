import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    headers: {
      'Content-Security-Policy': [
        "default-src 'self';",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' 'strict-dynamic' http://localhost:5173;",
        "script-src-elem 'self' 'unsafe-inline' http://localhost:5173;",
        "style-src 'self' 'unsafe-inline';",
        "img-src 'self' data: blob:;",
        "connect-src 'self' ws://localhost:* http://localhost:*;",
        "font-src 'self' data:;",
        "object-src 'none';",
        "base-uri 'self';",
        "frame-ancestors 'none';",
        "form-action 'self';",
        "upgrade-insecure-requests;"
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
