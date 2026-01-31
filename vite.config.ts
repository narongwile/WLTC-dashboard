import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // สำหรับ GitHub Pages: ใส่ชื่อ repo ของคุณ
  // ถ้า repo ชื่อ "BEV_homework" จะเป็น /BEV_homework/
  // ถ้าเป็น username.github.io ให้ใส่ '/'
  base: '/BEV_homework/',
})
