import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  define: {
    'process.env.VITE_TELEGRAM_BOT_TOKEN': JSON.stringify(process.env.VITE_TELEGRAM_BOT_TOKEN),
    'process.env.VITE_TELEGRAM_CHAT_ID': JSON.stringify(process.env.VITE_TELEGRAM_CHAT_ID),
    'process.env.VITE_MAX_ATTEMPTS': JSON.stringify(process.env.VITE_MAX_ATTEMPTS || '3'),
    'process.env.VITE_REDIRECT_DELAY': JSON.stringify(process.env.VITE_REDIRECT_DELAY || '3000')
  }
})