/**
 * @file socketHelpers.ts
 * @description Utilidades para emisión de eventos Socket.io
 * 
 * Centraliza la lógica de envío de eventos a salas de usuarios
 */

import { Types } from 'mongoose';

/**
 * Emite un evento a la sala privada de un usuario específico
 * 
 * @param io - Instancia de Socket.io
 * @param userId - ID del usuario (ObjectId o string)
 * @param eventName - Nombre del evento a emitir
 * @param data - Datos a enviar con el evento
 * 
 * @example
 * emitToUser(req.io, friend._id, 'notification', { message: 'Nueva solicitud' });
 */
export function emitToUser(
  io: any,
  userId: Types.ObjectId | string,
  eventName: string,
  data: any
): void {
  const userIdStr = userId.toString();
  io.to(`user:${userIdStr}`).emit(eventName, data);
}

/**
 * Emite múltiples eventos a la sala privada de un usuario
 * 
 * @param io - Instancia de Socket.io
 * @param userId - ID del usuario (ObjectId o string)
 * @param events - Array de objetos { eventName, data }
 * 
 * @example
 * emitMultipleToUser(req.io, friend._id, [
 *   { eventName: 'notification', data: notification },
 *   { eventName: 'friendRequestReceived', data: requestData }
 * ]);
 */
export function emitMultipleToUser(
  io: any,
  userId: Types.ObjectId | string,
  events: Array<{ eventName: string; data: any }>
): void {
  const userIdStr = userId.toString();
  const room = `user:${userIdStr}`;
  
  events.forEach(({ eventName, data }) => {
    io.to(room).emit(eventName, data);
  });
}
