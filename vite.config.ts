import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/companion-chat/',
  server: {
    port: 8000,
    open: '/companion-chat/',
  },
})