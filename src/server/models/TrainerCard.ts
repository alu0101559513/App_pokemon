/**
 * @file TrainerCard.ts
 * @description Modelo de Cartas de Entrenador Pokémon
 * 
 * Almacena información de cartas de Entrenador del TCG Pokémon.
 * Las cartas de entrenador son cartas de apoyo que proporcionan efectos especiales.
 * 
 * @requires mongoose - ODM para MongoDB
 */

import mongoose from 'mongoose';

/**
 * Esquema de Carta de Entrenador
 * 
 * @typedef {Object} TrainerCard
 * @property {string} pokemonTcgId - ID único de la API TCG
 * @property {string} name - Nombre de la carta de entrenador
 * @property {string} supertype - Tipo principal
 * @property {string} subtype - Subtipo (Objeto, Supporter, Stadium)
 * @property {string} series - Serie a la que pertenece
 * @property {string} set - Conjunto/Extensión
 * @property {string} rarity - Rareza de la carta
 * @property {Object} images - URLs de imágenes (small, large)
 * @property {string} text - Descripción y efectos del entrenador
 * @property {string} effect - Efecto principal de la carta
 * @property {string} illustrator - Ilustrador
 * @property {Object} price - Información de precios en varios mercados
 * @property {string} artist - Artista
 * @property {string} cardNumber - Número de la carta en el conjunto
 * @property {number} marketPrice - Precio en el mercado
 * @property {Date} lastPriceUpdate - Última actualización de precio
 * @property {string} category - Categoría (siempre 'trainer')
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de última actualización
 */
const trainerCardSchema = new mongoose.Schema({
  pokemonTcgId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  supertype: { type: String },
  subtype: { type: String },
  series: { type: String },
  set: { type: String },
  rarity: { type: String },
  images: {
    small: String,
    large: String
  },
  text: { type: String },
  effect: { type: String },
  illustrator: { type: String },
  price: {
    cardmarketAvg: { type: Number, default: null },
    tcgplayerMarketPrice: { type: Number, default: null },
    avg: { type: Number, default: 0 }
  },
  artist: { type: String },
  cardNumber: { type: String },
  marketPrice: { type: Number, default: 0 },
  lastPriceUpdate: { type: Date }
}, { timestamps: true });

/**
 * Agregación de campo categoría a cartas de entrenador
 */
trainerCardSchema.add({ category: { type: String, enum: ['pokemon','trainer','energy','unknown'], default: 'trainer' } });

/**
 * Modelo de Carta de Entrenador exportado
 * @type {mongoose.Model}
 */
export const TrainerCard = mongoose.model('TrainerCard', trainerCardSchema);
