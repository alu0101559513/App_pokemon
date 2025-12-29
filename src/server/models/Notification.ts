/**
 * @file Notification.ts
 * @description Modelo de Notificación para Usuarios
 *
 * Almacena notificaciones del sistema, mensajes, solicitudes de amistad
 * y alertas de trading para los usuarios.
 *
 * @requires mongoose - ODM para MongoDB
 */

import mongoose from 'mongoose';

/**
 * Esquema de Notificación
 *
 * @typedef {Object} Notification
 * @property {ObjectId} userId - ID del usuario destinatario
 * @property {string} type - Tipo (trade, message, friendRequest, system)
 * @property {string} title - Título de la notificación
 * @property {string} message - Contenido de la notificación
 * @property {boolean} isRead - Si ha sido leída
 * @property {ObjectId} relatedId - ID de la entidad relacionada (Trade, Message, etc)
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de última actualización
 */
const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['trade', 'message', 'friendRequest', 'system'],
      default: 'system',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Modelo de Notificación exportado
 * @type {mongoose.Model}
 */
export const Notification = mongoose.model('Notification', notificationSchema);
