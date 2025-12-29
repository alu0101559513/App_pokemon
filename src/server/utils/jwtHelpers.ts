/**
 * @file jwtHelpers.ts
 * @description Utilidades para generación y manejo de JSON Web Tokens
 * 
 * Centraliza la lógica de generación de tokens JWT
 */

import jwt from 'jsonwebtoken';

/**
 * Genera un token JWT para autenticación de usuario
 * 
 * @param userId - ID del usuario
 * @param username - Nombre de usuario
 * @param expiresIn - Tiempo de expiración (por defecto 7 días)
 * @returns Token JWT firmado
 * 
 * @example
 * const token = generateAuthToken(user._id.toString(), user.username);
 */
export function generateAuthToken(
  userId: string,
  username: string,
  expiresIn: string = '7d'
): string {
  const secret = process.env.JWT_SECRET || 'tu-clave-secreta';
  
  return jwt.sign(
    { userId, username },
    secret,
    { expiresIn } as jwt.SignOptions
  );
}
