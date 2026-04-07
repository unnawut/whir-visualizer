import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  // Only apply the GH Pages subpath for production builds — keeping it in dev
  // can break Vite's HMR WebSocket and force full reloads.
  base: command === 'build' ? '/whir-visualizer/' : '/',
}))
