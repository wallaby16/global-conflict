import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 1. plugin Tailwind 

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss() // 2. them vao mang plugin
  ],
})
