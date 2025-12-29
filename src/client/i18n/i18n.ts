/**
 * @file i18n.ts
 * @description Configuración de internacionalización (i18n)
 *
 * Configura soporte multiidioma para la aplicación:
 * - Idiomas soportados: Español (es), Inglés (en)
 * - Detección automática del navegador
 * - Almacenamiento en localStorage
 * - Idioma por defecto: Español
 *
 * @requires i18next - Framework de internacionalización
 * @requires react-i18next - Integración con React
 * @requires i18next-browser-languagedetector - Detección de idioma del navegador
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import esTranslations from './locales/es.json';
import enTranslations from './locales/en.json';

/**
 * Inicialización de i18n
 * Configura detección automática, persistencia y recursos de traducción
 */
i18n
  /**
   * Middleware para detectar idioma del navegador
   */
  .use(LanguageDetector)

  /**
   * Integración con React
   */
  .use(initReactI18next)

  /**
   * Inicializar configuración
   */
  .init({
    /**
     * Idioma por defecto si no se detecta ninguno
     */
    fallbackLng: 'es',

    /**
     * Configuración de detección de idioma
     */
    detection: {
      /**
       * Orden de prioridad para detectar idioma
       * 1. localStorage (preferencia guardada del usuario)
       * 2. Navegador (idioma del sistema)
       */
      order: ['localStorage', 'navigator'],

      /**
       * Cachés donde guardar la detección
       */
      caches: ['localStorage'],
    },

    /**
     * Recursos de traducción cargados
     */
    resources: {
      /**
       * Traducciones en español
       */
      es: {
        translation: esTranslations,
      },
      /**
       * Traducciones en inglés
       */
      en: {
        translation: enTranslations,
      },
    },
  });

/**
 * Instancia de i18n exportada
 * Se usa en toda la aplicación con hooks de React
 * @type {typeof i18n}
 */
export default i18n;
