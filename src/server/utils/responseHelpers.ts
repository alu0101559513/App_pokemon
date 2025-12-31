/**
 * @file responseHelpers.ts
 * @description Utilidades para estandarizar respuestas HTTP y manejo de errores
 * 
 * Proporciona funciones helper para:
 * - Respuestas exitosas consistentes
 * - Manejo de errores estandarizado
 * - Validaciones comunes
 * - Paginación normalizada
 * - Wrapper asyncHandler para eliminar try-catch duplicado
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Envía una respuesta exitosa estandarizada
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
) {
  return res.status(statusCode).send({
    success: true,
    ...(message && { message }),
    data,
  });
}

/**
 * Envía una respuesta de error estandarizada
 */
export function sendError(
  res: Response,
  error: string | Error,
  statusCode: number = 500
) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  return res.status(statusCode).send({
    success: false,
    error: errorMessage,
  });
}

/**
 * Maneja errores de Mongoose comunes
 */
export function handleMongooseError(res: Response, error: any) {
  if (error.name === 'ValidationError') {
    return sendError(res, 'Datos de validación incorrectos', 400);
  }
  
  if (error.name === 'CastError') {
    return sendError(res, 'ID inválido', 400);
  }
  
  if (error.code === 11000) {
    return sendError(res, 'El recurso ya existe', 409);
  }
  
  return sendError(res, error);
}

/**
 * Envía una respuesta paginada estandarizada
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number
) {
  const totalPages = Math.ceil(total / limit);
  
  return sendSuccess(res, {
    items: data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
}

/**
 * Valida campos requeridos en el body
 * Retorna true si todos están presentes, false en caso contrario
 */
export function validateRequiredFields(
  body: any,
  fields: string[],
  res: Response
): boolean {
  const missing = fields.filter(field => !body[field]);
  
  if (missing.length > 0) {
    sendError(
      res,
      `Campos requeridos faltantes: ${missing.join(', ')}`,
      400
    );
    return false;
  }
  
  return true;
}

/**
 * Verifica que un recurso existe, si no envía 404
 */
export function ensureResourceExists<T>(
  res: Response,
  resource: T | null,
  resourceName: string = 'Recurso'
): resource is T {
  if (!resource) {
    sendError(res, `${resourceName} no encontrado`, 404);
    return false;
  }
  return true;
}

/**
 * Parsea y valida parámetros de paginación
 */
export function parsePaginationParams(query: any): { page: number; limit: number } {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit as string) || 20));
  
  return { page, limit };
}

/**
 * Wrapper para manejar errores en async route handlers
 * Elimina la necesidad de try-catch en cada endpoint
 * 
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.find();
 *   sendSuccess(res, users);
 * }));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Si ya se envió una respuesta, no hacer nada
      if (res.headersSent) {
        return next(error);
      }
      
      // Usar handleMongooseError para errores comunes de Mongoose
      if (error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) {
        return handleMongooseError(res, error);
      }
      
      // Para otros errores, enviar error genérico
      return sendError(res, error, error.statusCode || 500);
    });
  };
}
