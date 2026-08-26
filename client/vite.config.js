import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // if hosting on GitHub Pages at root, base should be './' or '/'
  base: './', 
})
