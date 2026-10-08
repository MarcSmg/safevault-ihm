import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // pdf.js n est appele qu au premier apercu : sans cette ligne, le serveur
  // de developpement le decouvrirait a ce moment-la et rechargerait la page.
  optimizeDeps: { include: ['pdfjs-dist'] },
})
