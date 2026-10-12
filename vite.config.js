import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // host: true lo expone en la red local, para abrirlo desde el celular
    host: true,
    port: 5190,
  },
})
