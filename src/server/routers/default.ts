/**
 * @file default.ts
 * @description Router por defecto para rutas no especificadas
 * 
 * Maneja todas las rutas que no están definidas en otros routers.
 * Retorna 501 (Not Implemented) para cualquier ruta desconocida.
 * 
 * @requires express - Framework web
 */

import express from 'express';

/**
 * Router por defecto
 * Última opción en la cadena de routers
 */
export const defaultRouter = express.Router();

/**
 * Ruta por defecto, cualquier ruta no especificada entrará aqui
 * Retorna status 501 (Not Implemented)
 */
defaultRouter.all('/{*splat}', (_, res) => {
  res.status(501).send();
});