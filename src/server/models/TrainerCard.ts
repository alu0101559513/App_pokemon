/**
 * @file TrainerCard.ts
 * @description Discriminator de Card para cartas de tipo Entrenador
 *
 * Extiende el modelo base Card añadiendo campos específicos de cartas Entrenador:
 * texto descriptivo, efecto, y subtipo (Supporter, Item, Stadium).
 *
 * Usa el patrón discriminator de Mongoose, todas las cartas se almacenan
 * en la colección 'cards' con category='trainer'.
 *
 * @requires mongoose - ODM para MongoDB
 * @requires Card - Modelo base
 */

import mongoose from 'mongoose';
import { Card } from './Card.js';

/**
 * Esquema específico de Carta de Entrenador (solo campos únicos)
 *
 * Hereda todos los campos comunes de Card y añade solo los específicos.
 *
 * @typedef {Object} TrainerCardExtension
 * @property {string} subtype - Subtipo (Supporter, Item, Stadium, Tool)
 * @property {string} text - Descripción completa y efectos del entrenador
 * @property {string} effect - Efecto principal de la carta (opcional)
 */
const trainerCardSchema = new mongoose.Schema({
  subtype: { type: String },
  text: { type: String },
  effect: { type: String },
});

/**
 * Modelo de Carta de Entrenador como discriminator de Card
 * Automáticamente hereda todos los campos de Card.
 * 
 * category='trainer' se establece automáticamente
 * 
 * @type {mongoose.Model}
 */
export const TrainerCard = Card.discriminator('trainer', trainerCardSchema);
