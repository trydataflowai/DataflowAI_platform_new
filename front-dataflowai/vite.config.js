import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Carga automáticamente las variables del archivo .env o .env.production
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) }

  return {
    plugins: [react()],
  }
})
