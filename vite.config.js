import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
 
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    watch: { ignored: ['**/public/games/**'] },
    port: 5173,
    host: 'localhost',
    open: false,
  },
})