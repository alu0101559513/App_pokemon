/**
 * @file FriendTrade.ts
 * @description Modelo de Invitaciones a Salas de Trading entre Amigos
 *
 * Gestiona las invitaciones de trading privado entre amigos.
 * Incluye estado de aceptación, código de sala y referencia al trade.
 *
 * @requires mongoose - ODM para MongoDB
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Esquema de Invitación de Sala de Trading entre Amigos
 *
 * @typedef {Object} FriendTradeRoomInvite
 * @property {ObjectId} from - ID del usuario que invita
 * @property {ObjectId} to - ID del usuario invitado
 * @property {string} status - Estado (pending, accepted, rejected, cancelled, completed)
 * @property {string} privateRoomCode - Código único de la sala privada
 * @property {ObjectId} tradeId - ID del Trade asociado
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} completedAt - Fecha de finalización
 * @property {Date} updatedAt - Fecha de última actualización
 */
const friendTradeRoomInviteSchema = new Schema(
  {
    from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },

    privateRoomCode: {
      type: String,
      default: null,
    },

    tradeId: {
      type: Schema.Types.ObjectId,
      ref: 'Trade',
      default: null,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Modelo de Invitación de Sala de Trading entre Amigos exportado
 * @type {mongoose.Model}
 */
export const FriendTradeRoomInvite = mongoose.model(
  'FriendTradeRoomInvite',
  friendTradeRoomInviteSchema
);
