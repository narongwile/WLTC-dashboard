import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages: ใส่ชื่อ repo ของคุณ
  // เช่น repo ชื่อ "wltc-dashboard" → base: '/wltc-dashboard/'
  base: '/wltc-dashboard/',
})
