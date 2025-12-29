/**
 * @file userHelpers.ts
 * @description Utilidades para operaciones comunes con usuarios
 * 
 * Centraliza lógica repetitiva de búsqueda y validación de usuarios
 */

import { User } from '../models/User.js';
import { UserCard } from '../models/UserCard.js';
import { Response } from 'express';
import { sendError } from './responseHelpers.js';

/**
 * Busca un usuario por ID o username
 * 
 * @param identifier - ID de MongoDB o username del usuario
 * @returns Usuario encontrado o null
 */
export async function findUserByIdentifier(identifier: string) {
  // Intentar buscar por ObjectId primero
  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    const userById = await User.findById(identifier);
    if (userById) return userById;
  }
  
  // Buscar por username
  return await User.findOne({ username: identifier });
}

/**
 * Busca un usuario y envía error 404 si no existe
 * 
 * @param identifier - ID o username
 * @param res - Response object de Express
 * @returns Usuario encontrado o null (con respuesta enviada)
 */
export async function findUserOrFail(identifier: string, res: Response) {
  const user = await findUserByIdentifier(identifier);
  
  if (!user) {
    sendError(res, 'Usuario no encontrado', 404);
    return null;
  }
  
  return user;
}

/**
 * Verifica si un username o email ya están en uso
 * 
 * @param username - Username a verificar
 * @param email - Email a verificar
 * @returns true si ya existe, false si está disponible
 */
export async function checkUserExists(username: string, email: string): Promise<boolean> {
  const existing = await User.findOne({
    $or: [{ username }, { email }],
  });
  
  return !!existing;
}

/**
 * Sanitiza los datos de usuario para respuestas públicas
 * Elimina campos sensibles como password
 */
export function sanitizeUserData(user: any) {
  const sanitized: any = user.toObject ? user.toObject() : { ...user };
  
  // Eliminar campos sensibles
  delete sanitized.password;
  delete sanitized.__v;
  
  return {
    id: sanitized._id,
    username: sanitized.username,
    email: sanitized.email,
    profileImage: sanitized.profileImage || '',
    createdAt: sanitized.createdAt,
    // Incluir otros campos públicos según necesidad
  };
}

/**
 * NUEVA FUNCIÓN: Valida el tipo de colección (collection o wishlist)
 * Retorna true si es válido, false si no
 */
export function isValidCollectionType(type: any): boolean {
  return ['collection', 'wishlist'].includes(type);
}

/**
 * NUEVA FUNCIÓN: Obtiene las cartas paginadas de un usuario con filtros
 * Consolida la lógica repetida de los 3 endpoints GET de usercard.ts
 * 
 * @param username - Username del usuario
 * @param filter - Filtro adicional (ej: { collectionType: 'collection' })
 * @param options - { page, limit, forTrade? }
 * @returns { cards, pageNum, totalPages, total, limitNum }
 */
export async function getUserCardsPaginated(
  username: string,
  additionalFilter: Record<string, any> = {},
  options: { page?: any; limit?: any; forTrade?: any } = {}
) {
  const { page = '1', limit, forTrade } = options;

  // Buscar usuario
  const user = await User.findOne({ username });
  if (!user) return { error: 'Usuario no encontrado', statusCode: 404 };

  // Parsear paginación
  const pageNum = Number(page) || 1;
  const limitNum = limit !== undefined ? Number(limit) : null;
  const skip = limitNum ? (pageNum - 1) * limitNum : 0;

  // Construir filtro
  const filter: any = { userId: user._id, ...additionalFilter };
  if (forTrade !== undefined) {
    const ft = String(forTrade);
    filter.forTrade = ft === 'true' || ft === '1';
  }

  // Ejecutar query con populate
  let query = UserCard.find(filter)
    .populate('cardId', 'name images rarity set price pokemonTcgId category supertype series illustrator hp types attacks abilities')
    .sort({ createdAt: -1 });

  if (skip) query = query.skip(skip);
  if (limitNum) query = query.limit(limitNum);

  const cards = await query.exec();
  const total = await UserCard.countDocuments(filter);
  const totalPages = limitNum ? Math.ceil(total / limitNum) : 1;

  return {
    cards,
    pageNum,
    totalPages,
    total,
    limitNum: limitNum ?? total,
  };
}

/**
 * Valida la propiedad de un recurso (user authorization)
 * @param userId - ID del usuario actual (token)
 * @param resourceUserId - ID del usuario propietario del recurso
 * @returns true si el usuario es propietario, false si no
 */
export function validateOwnership(
  userId: any,
  resourceUserId: any
): boolean {
  return userId?.toString() === resourceUserId?.toString();
}

/**
 * Busca un amigo por ID o username (alias para findUserByIdentifier)
 * Se usa en endpoints de amigos para mayor claridad semántica
 * 
 * @param identifier - ID de MongoDB o username
 * @returns Usuario encontrado o null
 */
export async function findFriendByIdentifier(identifier: string) {
  return await findUserByIdentifier(identifier);
}

/**
 * Obtiene el usuario autenticado actual o envía error 404
 * @param userId - ID del usuario autenticado
 * @param res - Response object
 * @returns Usuario encontrado o null (respuesta enviada en caso de error)
 */
export async function getCurrentUserOrFail(userId: any, res?: Response) {
  if (!userId) {
    if (res) sendError(res, 'No autenticado', 401);
    return null;
  }
  
  const user = await User.findById(userId);
  if (!user && res) {
    sendError(res, 'Usuario actual no encontrado', 404);
    return null;
  }
  
  return user;
}
