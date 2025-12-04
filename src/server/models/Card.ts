/**
 * @file Card.ts
 * @description Modelo genérico de Carta Pokémon para la base de datos
 * 
 * Almacena información de cartas base sin detalles específicos de Pokemon,
 * Entrenador, o Energía. Se usa como referencia desde UserCard.
 * 
 * @requires mongoose - ODM para MongoDB
 */

import mongoose from 'mongoose';

/**
 * Esquema de Carta genérica
 * 
 * @typedef {Object} Card
 * @property {string} pokemonTcgId - ID único de la API TCG Pokémon
 * @property {string} name - Nombre de la carta
 * @property {string} series - Serie a la que pertenece
 * @property {string} set - Conjunto/Extensión
 * @property {string} rarity - Rareza de la carta
 * @property {Array<string>} types - Tipos de la carta (fuego, agua, etc)
 * @property {string} imageUrl - URL de imagen estándar
 * @property {string} illustrator - Ilustrador de la carta
 * @property {string} imageUrlHiRes - URL de imagen de alta resolución
 * @property {number} marketPrice - Precio en el mercado
 * @property {Object} price - Precios de diferentes mercados
 * @property {number} price.cardmarketAvg - Precio promedio de Cardmarket
 * @property {number} price.tcgplayerMarketPrice - Precio de TCGPlayer
 * @property {number} price.avg - Precio promedio calculado
 * @property {Date} lastPriceUpdate - Última actualización de precios
 * @property {number} nationalPokedexNumber - Número en la Pokédex nacional
 * @property {string} artist - Artista de la carta
 * @property {string} cardNumber - Número de carta en el conjunto
 * @property {string} category - Categoría (pokemon, trainer, energy, unknown)
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de última actualización
 */
const cardSchema = new mongoose.Schema({
  pokemonTcgId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  series: {
    type: String
  },
  set: {
    type: String
  },
  rarity: {
    type: String
  },
  types: [{
    type: String
  }],
  imageUrl: {
    type: String
  },
  illustrator: {
    type: String
  },
  imageUrlHiRes: {
    type: String
  },
  marketPrice: {
    type: Number,
    default: 0
  },
  price: {
    cardmarketAvg: { type: Number, default: null },
    tcgplayerMarketPrice: { type: Number, default: null },
    avg: { type: Number, default: 0 }
  },
  lastPriceUpdate: {
    type: Date
  },
  nationalPokedexNumber: {
    type: Number
  },
  artist: {
    type: String
  },
  cardNumber: {
    type: String
  }
  ,
  category: {
    type: String,
    enum: ['pokemon', 'trainer', 'energy', 'unknown'],
    default: 'unknown'
  }
}, {
  timestamps: true
});

/**
 * Modelo de Carta exportado
 * @type {mongoose.Model}
 */
export const Card = mongoose.model('Card', cardSchema);
