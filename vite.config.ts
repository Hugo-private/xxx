import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEV_PORT = Number(process.env.PORT ?? 5173)

const isCodespaces = process.env.CODESPACES === 'true' || !!process.env.CODESPACE_NAME
const forwardingDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN ?? 'app.github.dev'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/xxx/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: DEV_PORT,
    strictPort: true,
    ...(isCodespaces
      ? {
          allowedHosts: [`.${forwardingDomain}`],
        }
      : {}),
  },
  assetsInclude: ['**/*.JPG', '**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.webp', '**/*.svg'],
})
