import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  // THÊM DÒNG NÀY: Để định nghĩa đường dẫn tương đối trên GitHub Pages
  base: "/global-conflict/", 
  plugins: [
    react(),
    tailwindcss(),
  ],
})
