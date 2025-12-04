/**
 * @file tailwind.config.js
 * @description Configuración de Tailwind CSS
 * 
 * Configura:
 * - Modo oscuro: basado en clase CSS
 * - Paths de contenido: archivos de src/client
 * - Tema: extensión del tema por defecto de Tailwind
 * - Plugins: sin plugins adicionales
 * 
 * @type {import('tailwindcss').Config}
 */

/** @type {import('tailwindcss').Config} */
export default {
  /**
   * Modo oscuro: 'class' requiere agregar clase 'dark' en elemento raíz
   */
  darkMode: 'class',
  
  /**
   * Archivos donde Tailwind buscará clases CSS a usar
   * Solo se incluyen las clases que se usan realmente (tree-shaking)
   */
  content: [
    './src/client/index.html',
    './src/client/**/*.{js,ts,jsx,tsx}',
  ],
  
  /**
   * Extensión del tema por defecto de Tailwind
   * Se pueden agregar colores, fuentes, espaciados, etc.
   */
  theme: {
    extend: {},
  },
  
  /**
   * Plugins adicionales de Tailwind CSS
   * Actualmente sin plugins
   */
  plugins: [],
}
