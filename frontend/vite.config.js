import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Escucha en 0.0.0.0 para permitir acceso desde celulares en la misma red Wi-Fi
    port: 5173,
  }
})
