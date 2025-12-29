/**
 * @file PackOpen.ts
 * @description Modelo de Registro de Aperturas de Packs
 *
 * Registra cuándo un usuario abre un pack de cartas.
 * Se usa para controlar los tokens y el rate limiting de aperturas.
 *
 * @requires mongoose - ODM para MongoDB
 */

import mongoose from 'mongoose';

/**
 * Esquema de Apertura de Pack
 *
 * @typedef {Object} PackOpen
 * @property {ObjectId} userId - ID del usuario que abre el pack
 * @property {Date} createdAt - Fecha/hora de apertura del pack
 * @property {Date} updatedAt - Fecha de última actualización
 */
const packOpenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Índice para consultas optimizadas por usuario y fecha
 */
packOpenSchema.index({ userId: 1, createdAt: 1 });

/**
 * Modelo de Apertura de Pack exportado
 * @type {mongoose.Model}
 */
export const PackOpen = mongoose.model('PackOpen', packOpenSchema);
