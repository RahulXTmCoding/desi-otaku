import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    allowedHosts: [
      'localhost',
      'rahul.tail6c9a2a.ts.net'
    ]
  },
  plugins: [react()],
})
