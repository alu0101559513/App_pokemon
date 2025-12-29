import { Response } from 'express';
import mongoose from 'mongoose';
import { sendError } from './responseHelpers.js';
import { findUserByUsernameOrEmail } from './validationHelpers.js';

/**
 * Valida si un ID es un ObjectId válido de MongoDB
 * @param id - El ID a validar
 * @param res - Objeto Response de Express para enviar error si es inválido
 * @param fieldName - Nombre del campo para el mensaje de error (por defecto 'ID')
 * @returns true si es válido, false si no lo es (y envía respuesta de error)
 */
export function validateObjectId(
  id: string,
  res: Response,
  fieldName: string = 'ID'
): boolean {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    sendError(res, `${fieldName} no válido`, 400);
    return false;
  }
  return true;
}

/**
 * Busca un usuario de forma flexible (por username, email o ID)
 * Wrapper sobre findUserByUsernameOrEmail para uso consistente en routers
 * @param identifier - Username, email o ID del usuario
 * @returns Usuario encontrado o null si no existe
 */
export async function findUserFlexible(identifier: string) {
  return await findUserByUsernameOrEmail(identifier);
}
