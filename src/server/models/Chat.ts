/**
 * @file Chat.ts
 * @description Modelo de Mensajes Privados entre Usuarios
 *
 * Almacena mensajes privados intercambiados entre usuarios.
 * Los mensajes se borran automáticamente después de 3 días.
 *
 * @requires mongoose - ODM para MongoDB
 */

import mongoose from 'mongoose';

/**
 * Esquema de Mensaje de Chat
 *
 * @typedef {Object} ChatMessage
 * @property {ObjectId} from - ID del usuario remitente
 * @property {ObjectId} to - ID del usuario destinatario
 * @property {string} text - Contenido del mensaje
 * @property {Date} createdAt - Fecha de creación (se borra después de 3 días)
 */
const chatMessageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '3d',
  },
});

/**
 * Modelo de Mensaje de Chat exportado
 * @type {mongoose.Model}
 */
export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
