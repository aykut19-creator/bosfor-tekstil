import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Fix: Cast process to any to avoid TypeScript error 'Property cwd does not exist on type Process'
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        // Removing path alias to prevent build issues if node types are missing
      },
    },
    root: '.', 
    build: {
      outDir: 'dist',
    },
    define: {
      // Fix: Only define the specific API key, do NOT overwrite the entire process.env object
      // This prevents breaking React and Vite internal environment variables
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    }
  }
})