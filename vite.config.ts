/**
 * @file vite.config.ts
 * @description Configuración de Vite para el cliente React
 * 
 * Configura:
 * - Root en src/client (aplicación React)
 * - Plugins: React, Tailwind CSS
 * - Proxy para APIs locales
 * - Build output en dist/client
 * - Alias @ para importes desde src/client
 * 
 * Dev server: http://localhost:5173
 * API proxy: /api -> http://localhost:3000
 * 
 * @requires vite - Build tool
 * @requires @vitejs/plugin-react - Plugin para React
 * @requires @tailwindcss/vite - Tailwind CSS compiler
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

/**
 * Configuración de Vite exportada
 * @type {import('vite').UserConfig}
 */
export default defineConfig({
  /**
   * Raíz de la aplicación (donde está index.html)
   */
  root: 'src/client',
  
  /**
   * Plugins de Vite
   */
  plugins: [
    react(),
    tailwindcss(),
  ],
  
  /**
   * Directorio de archivos estáticos públicos
   */
  publicDir: '../../public',
  
  /**
   * Resolución de módulos
   */
  resolve: {
    /**
     * Alias para importes
     * @ apunta a src/client
     */
    alias: {
      '@': path.resolve(__dirname, './src/client'),
    },
  },
  
  /**
   * Configuración del servidor de desarrollo
   */
  server: {
    port: 5173,
    /**
     * Proxy para APIs
     * Las solicitudes a /api se redirigen a localhost:3000
     */
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  
  /**
   * Configuración de build de producción
   */
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
  },
})