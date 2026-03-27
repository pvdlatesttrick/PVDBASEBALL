import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  // Only set for GitHub Pages workflow (see deploy-pages.yml). Vercel/Netlify use "/".
  base: process.env.GITHUB_PAGES === 'true' ? '/PVDBASEBALL/' : '/',
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
