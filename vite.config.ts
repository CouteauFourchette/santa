import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/santa/',
  plugins: [tailwindcss()],
  build: {
    outDir: 'dist',
  },
})
