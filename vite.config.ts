import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgrPlugin from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgrPlugin()],
  resolve:{
    tsconfigPaths: true
  },
  root: "./src/frontend",
  build: {
    rollupOptions:{
      input: {
        app: "./src/frontend/index.html"
      }
    },
    outDir: "../../dist/frontend",
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    }
  }
});
