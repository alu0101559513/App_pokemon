/**
 * @file friendHelpers.ts
 * @description Helpers para operaciones de amigos (friends management)
 * 
 * Centraliza la lógica de:
 * - Gestión de solicitudes de amistad
 * - Operaciones bidireccionales de amigos
 * - Eliminación de relaciones
 */

import { User } from '../models/User.js';

/**
 * Elimina una solicitud de amistad del usuario
 * @param user - Usuario que recibió/tiene la solicitud
 * @param fromUserId - ID del usuario que envió la solicitud
 */
export function removeFriendRequest(user: any, fromUserId: any): void {
  (user.friendRequests as any) = (user.friendRequests as any).filter(
    (r: any) => r.from.toString() !== fromUserId.toString()
  );
}

/**
 * Verifica si existe una solicitud de amistad pendiente
 * @param user - Usuario
 * @param friendId - ID del amigo
 * @returns true si hay solicitud pendiente
 */
export function hasPendingFriendRequest(user: any, friendId: any): boolean {
  return user.friendRequests.some(
    (r: any) => r.from.toString() === friendId.toString()
  );
}

/**
 * Agrega amistad bidireccional entre dos usuarios
 * @param me - Usuario actual
 * @param friend - Usuario amigo
 */
export function addFriendBidirectional(me: any, friend: any): void {
  if (!me.friends.includes(friend._id)) {
    me.friends.push(friend._id);
  }
  if (!friend.friends.includes(me._id)) {
    friend.friends.push(me._id);
  }
}

/**
 * Elimina amistad bidireccional entre dos usuarios
 * @param me - Usuario actual
 * @param friend - Usuario amigo
 */
export function removeFriendBidirectional(me: any, friend: any): void {
  me.friends = me.friends.filter(
    (id: any) => id.toString() !== friend._id.toString()
  );
  friend.friends = friend.friends.filter(
    (id: any) => id.toString() !== me._id.toString()
  );
}

/**
 * Obtiene el historial de chat entre dos usuarios
 * @param ChatMessage - Modelo ChatMessage
 * @param userId1 - ID del usuario 1
 * @param userId2 - ID del usuario 2
 * @returns Array de mensajes ordenados por fecha
 */
export async function getChatHistoryBetween(
  ChatMessage: any,
  userId1: any,
  userId2: any
) {
  return await ChatMessage.find({
    $or: [
      { from: userId1, to: userId2 },
      { from: userId2, to: userId1 },
    ],
  }).sort({ createdAt: 1 });
}

/**
 * Elimina el historial de chat entre dos usuarios
 * @param ChatMessage - Modelo ChatMessage
 * @param userId1 - ID del usuario 1
 * @param userId2 - ID del usuario 2
 */
export async function deleteChatHistoryBetween(
  ChatMessage: any,
  userId1: any,
  userId2: any
): Promise<void> {
  await ChatMessage.deleteMany({
    $or: [
      { from: userId1, to: userId2 },
      { from: userId2, to: userId1 },
    ],
  });
}
