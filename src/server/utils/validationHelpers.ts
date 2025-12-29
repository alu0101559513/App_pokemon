/**
 * @file validationHelpers.ts
 * @description Helpers para validaciones comunes de usuarios
 * 
 * Centraliza la lógica de:
 * - Búsqueda por username o email
 * - Validación de existencia de credenciales
 * - Validación de propiedad de recursos
 */

import { User } from '../models/User.js';

/**
 * Busca un usuario por username o email
 * @param identifier - Username o email del usuario
 * @returns Usuario encontrado o null
 */
export async function findUserByUsernameOrEmail(identifier: string) {
  return await User.findOne({
    $or: [{ username: identifier }, { email: identifier }],
  });
}

/**
 * Valida que un username y email no estén en uso
 * @param newUsername - Username a validar (puede ser undefined si no se cambia)
 * @param newEmail - Email a validar (puede ser undefined si no se cambia)
 * @param currentUsername - Username actual del usuario (para comparación)
 * @param currentEmail - Email actual del usuario (para comparación)
 * @returns { valid: boolean, field?: string, error?: string }
 */
export async function validateUsernameEmail(
  newUsername?: string,
  newEmail?: string,
  currentUsername?: string,
  currentEmail?: string
): Promise<{ valid: boolean; field?: string; error?: string }> {
  // Validar username si es diferente al actual
  if (newUsername && newUsername !== currentUsername) {
    const existsUser = await User.findOne({ username: newUsername });
    if (existsUser) {
      return { valid: false, field: 'username', error: 'USERNAME_EXISTS' };
    }
  }

  // Validar email si es diferente al actual
  if (newEmail && newEmail !== currentEmail) {
    const existsEmail = await User.findOne({ email: newEmail });
    if (existsEmail) {
      return { valid: false, field: 'email', error: 'EMAIL_EXISTS' };
    }
  }

  return { valid: true };
}

/**
 * Valida que el usuario actual sea propietario del recurso
 * @param reqUsername - Username del usuario autenticado (de req.username)
 * @param paramUsername - Username del parámetro de ruta
 * @returns true si es propietario, false si no
 */
export function validateUsernameOwnership(
  reqUsername: string,
  paramUsername: string
): boolean {
  return reqUsername === paramUsername;
}

/**
 * Valida los campos requeridos para registración
 * @param username - Username
 * @param email - Email
 * @param password - Contraseña
 * @param confirmPassword - Confirmación de contraseña
 * @returns { valid: boolean, error?: string }
 */
export function validateRegistrationInput(
  username?: string,
  email?: string,
  password?: string,
  confirmPassword?: string
): { valid: boolean; error?: string } {
  if (!username || !email || !password || !confirmPassword) {
    return { valid: false, error: 'Todos los campos son requeridos' };
  }

  if (password !== confirmPassword) {
    return { valid: false, error: 'Las contraseñas no coinciden' };
  }

  return { valid: true };
}
