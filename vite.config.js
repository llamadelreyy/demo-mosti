import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import disableHostCheck from './vite-host-plugin.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), disableHostCheck()],
  server: {
    host: true,
    port: 5174,
    strictPort: false,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        secure: false
      }
    },
    watch: {
      ignored: ['**/backend/**', '**/node_modules/**']
    }
  }
})