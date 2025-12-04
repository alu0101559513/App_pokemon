/**
 * @file EnergyCard.ts
 * @description Modelo de Cartas de Energía Pokémon
 * 
 * Almacena información de cartas de energía del TCG Pokémon.
 * Las cartas de energía son cartas de apoyo esenciales para jugar.
 * 
 * @requires mongoose - ODM para MongoDB
 */

import mongoose from 'mongoose';

/**
 * Esquema de Carta de Energía
 * 
 * @typedef {Object} EnergyCard
 * @property {string} pokemonTcgId - ID único de la API TCG
 * @property {string} name - Nombre de la carta de energía
 * @property {string} supertype - Tipo principal
 * @property {string} subtype - Subtipo
 * @property {string} energyType - Tipo de energía (fuego, agua, etc)
 * @property {string} series - Serie a la que pertenece
 * @property {string} set - Conjunto/Extensión
 * @property {string} rarity - Rareza de la carta
 * @property {Object} images - URLs de imágenes (small, large)
 * @property {string} text - Descripción y efectos
 * @property {string} illustrator - Ilustrador
 * @property {Object} price - Información de precios en varios mercados
 * @property {string} artist - Artista
 * @property {string} cardNumber - Número de la carta en el conjunto
 * @property {number} marketPrice - Precio en el mercado
 * @property {Date} lastPriceUpdate - Última actualización de precio
 * @property {string} category - Categoría (siempre 'energy')
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de última actualización
 */
const energyCardSchema = new mongoose.Schema({
  pokemonTcgId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  supertype: { type: String },
  subtype: { type: String },
  energyType: { type: String },
  series: { type: String },
  set: { type: String },
  rarity: { type: String },
  images: {
    small: String,
    large: String
  },
  text: { type: String },
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
 * Agregación de campo categoría a cartas de energía
 */
energyCardSchema.add({ category: { type: String, enum: ['pokemon','trainer','energy','unknown'], default: 'energy' } });

/**
 * Modelo de Carta de Energía exportado
 * @type {mongoose.Model}
 */
export const EnergyCard = mongoose.model('EnergyCard', energyCardSchema);
