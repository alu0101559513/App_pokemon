/**
 * @file EnergyCard.ts
 * @description Discriminator de Card para cartas de tipo Energía
 *
 * Extiende el modelo base Card añadiendo campos específicos de cartas Energía:
 * tipo de energía, texto descriptivo y subtipo.
 *
 * Usa el patrón discriminator de Mongoose, todas las cartas se almacenan
 * en la colección 'cards' con category='energy'.
 *
 * @requires mongoose - ODM para MongoDB
 * @requires Card - Modelo base
 */

import mongoose from 'mongoose';
import { Card } from './Card.js';

/**
 * Esquema específico de Carta de Energía (solo campos únicos)
 *
 * Hereda todos los campos comunes de Card y añade solo los específicos.
 *
 * @typedef {Object} EnergyCardExtension
 * @property {string} subtype - Subtipo (Basic, Special)
 * @property {string} energyType - Tipo de energía (Fire, Water, Colorless, etc.)
 * @property {string} text - Descripción y reglas de la energía
 */
const energyCardSchema = new mongoose.Schema({
  subtype: { type: String },
  energyType: { type: String },
  text: { type: String },
});

/**
 * Modelo de Carta de Energía como discriminator de Card
 * Automáticamente hereda todos los campos de Card.
 * 
 * category='energy' se establece automáticamente
 * 
 * @type {mongoose.Model}
 */
export const EnergyCard = Card.discriminator('energy', energyCardSchema);
