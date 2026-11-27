import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
  index: 'index.html',
  student: 'student.html',
  sk: 'sk.html'
}   
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/backend': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backend/, ''),
      },
    },
  },
})