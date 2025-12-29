/**
 * @file TradeRequest.ts
 * @description Modelo de Solicitud de Intercambio de Cartas
 *
 * Registra solicitudes de intercambio entre usuarios,
 * incluyendo cartas específicas solicitadas y estados.
 *
 * @requires mongoose - ODM para MongoDB
 */

import mongoose from 'mongoose';

/**
 * Esquema de Solicitud de Trade
 *
 * @typedef {Object} TradeRequest
 * @property {ObjectId} from - ID del usuario que solicita
 * @property {ObjectId} to - ID del usuario destinatario
 * @property {string} pokemonTcgId - ID TCG de la carta solicitada
 * @property {string} cardName - Nombre de la carta
 * @property {string} cardImage - URL de la imagen de la carta
 * @property {string} note - Nota o comentario del solicitante
 * @property {string} status - Estado (pending, accepted, rejected, cancelled, completed)
 * @property {boolean} isManual - Si fue creada manualmente o automáticamente
 * @property {ObjectId} tradeId - ID del Trade relacionado
 * @property {Date} finishedAt - Fecha de finalización (se borra después de 2 días)
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de última actualización
 */
const tradeRequestSchema = new mongoose.Schema(
  {
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
    pokemonTcgId: {
      type: String,
      required: true,
    },
    cardName: {
      type: String,
      default: '',
    },
    cardImage: {
      type: String,
      default: '',
    },
    note: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },
    isManual: {
      type: Boolean,
      default: false,
    },
    tradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trade',
      default: null,
    },
    finishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Índice TTL para borrar solicitudes finalizadas después de 2 días
 * Libera espacio en base de datos automáticamente
 */
tradeRequestSchema.index(
  { finishedAt: 1 },
  {
    expireAfterSeconds: 2 * 24 * 60 * 60,
    partialFilterExpression: { finishedAt: { $ne: null } },
  }
);

/**
 * Modelo de Solicitud de Trade exportado
 * @type {mongoose.Model}
 */
export const TradeRequest = mongoose.model('TradeRequest', tradeRequestSchema);
