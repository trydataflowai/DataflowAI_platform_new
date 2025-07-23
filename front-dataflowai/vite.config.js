import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) }

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    server: {
      historyApiFallback: true, // Esto es importante solo en local
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  }
})
