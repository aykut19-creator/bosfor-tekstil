import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve('./src'),
      },
    },
    root: '.', 
    build: {
      outDir: 'dist',
    },
    define: {
      'process.env': {
        API_KEY: env.API_KEY || ''
      }
    }
  }
})