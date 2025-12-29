/**
 * @file UserCard.ts
 * @description Modelo de Carta del Usuario en su Colección
 *
 * Representa una carta específica que posee un usuario,
 * incluyendo condición, estado de público/privado, si está en venta, etc.
 *
 * @requires mongoose - ODM para MongoDB
 */

import mongoose from 'mongoose';

/**
 * Esquema de Carta del Usuario
 *
 * @typedef {Object} UserCard
 * @property {ObjectId} userId - ID del propietario
 * @property {ObjectId} cardId - Referencia a la carta
 * @property {string} pokemonTcgId - ID TCG de la carta
 * @property {string} condition - Condición (Mint, Near Mint, Excellent, Good, Poor)
 * @property {boolean} isPublic - Visible en el perfil público
 * @property {boolean} isFavorite - Marcada como favorita
 * @property {Date} acquisitionDate - Fecha de adquisición
 * @property {string} notes - Notas personales del usuario
 * @property {number} quantity - Cantidad de copias
 * @property {number} estimatedValue - Valor estimado
 * @property {boolean} forTrade - Disponible para intercambio
 * @property {string} collectionType - Tipo (collection o wishlist)
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de última actualización
 */
const userCardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
      required: true,
    },
    pokemonTcgId: {
      type: String,
      required: true,
    },
    condition: {
      type: String,
      enum: ['Mint', 'Near Mint', 'Excellent', 'Good', 'Poor'],
      default: 'Near Mint',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    acquisitionDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    estimatedValue: {
      type: Number,
    },
    forTrade: {
      type: Boolean,
      default: false,
    },
    collectionType: {
      type: String,
      enum: ['collection', 'wishlist'],
      default: 'collection',
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Índices para optimizar consultas frecuentes
 */
userCardSchema.index({ userId: 1, cardId: 1 });
userCardSchema.index({ userId: 1, isPublic: 1 });
userCardSchema.index({ userId: 1, collectionType: 1 });

/**
 * Modelo de Carta del Usuario exportado
 * @type {mongoose.Model}
 */
export const UserCard = mongoose.model('UserCard', userCardSchema);
