import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages: ชื่อ repo ต้องตรงทั้ง uppercase/lowercase
  base: '/WLTC-dashboard/',
})
