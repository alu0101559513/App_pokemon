/**
 * @file PokemonCard.ts
 * @description Modelo detallado de Cartas Pokémon con toda la información de juego
 * 
 * Almacena información completa de cartas Pokémon incluyendo ataques,
 * habilidades, debilidades, costos de retirada y más datos de juego.
 * 
 * @requires mongoose - ODM para MongoDB
 */

import mongoose from 'mongoose';

/**
 * Esquema de Ataque
 * @typedef {Object} Attack
 * @property {string} name - Nombre del ataque
 * @property {Array<string>} cost - Costo energético del ataque
 * @property {string} damage - Daño infligido
 * @property {string} text - Descripción del efecto
 */
const attackSchema = new mongoose.Schema({
  name: String,
  cost: [String],
  damage: String,
  text: String
}, { _id: false });

/**
 * Esquema de Habilidad
 * @typedef {Object} Ability
 * @property {string} name - Nombre de la habilidad
 * @property {string} text - Descripción de la habilidad
 * @property {string} type - Tipo de habilidad
 */
const abilitySchema = new mongoose.Schema({
  name: String,
  text: String,
  type: String
}, { _id: false });

/**
 * Esquema de Debilidad/Resistencia
 * @typedef {Object} Weakness
 * @property {string} type - Tipo de Pokémon (fuego, agua, etc)
 * @property {string} value - Multiplicador de daño
 */
const weaknessSchema = new mongoose.Schema({
  type: String,
  value: String
}, { _id: false });

/**
 * Esquema principal de Carta Pokémon
 * 
 * @typedef {Object} PokemonCard
 * @property {string} pokemonTcgId - ID único de la API TCG
 * @property {string} name - Nombre del Pokémon
 * @property {string} supertype - Tipo principal (Pokémon, Trainer, Energy)
 * @property {string} subtype - Subtipo
 * @property {string} hp - Puntos de salud
 * @property {Array<string>} types - Tipos del Pokémon
 * @property {string} evolvesFrom - Pokémon anterior en la evolución
 * @property {Array<Ability>} abilities - Habilidades de la carta
 * @property {Array<Attack>} attacks - Ataques disponibles
 * @property {Array<Weakness>} weaknesses - Debilidades de tipos
 * @property {Array<Weakness>} resistances - Resistencias de tipos
 * @property {Array<string>} retreatCost - Costo de retirada
 * @property {string} series - Serie a la que pertenece
 * @property {string} set - Conjunto/Extensión
 * @property {string} rarity - Rareza
 * @property {Object} images - URLs de imágenes
 * @property {string} illustrator - Ilustrador
 * @property {Object} price - Información de precios
 * @property {number} nationalPokedexNumber - Número en Pokédex
 * @property {string} artist - Artista
 * @property {string} cardNumber - Número en el conjunto
 * @property {number} marketPrice - Precio de mercado
 * @property {Date} lastPriceUpdate - Última actualización de precio
 * @property {string} category - Categoría (pokemon, trainer, energy, unknown)
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de última actualización
 */
const pokemonCardSchema = new mongoose.Schema({
  pokemonTcgId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  supertype: { type: String },
  subtype: { type: String },
  hp: { type: String },
  types: [{ type: String }],
  evolvesFrom: { type: String },
  abilities: [abilitySchema],
  attacks: [attackSchema],
  weaknesses: [weaknessSchema],
  resistances: [weaknessSchema],
  retreatCost: [{ type: String }],
  series: { type: String },
  set: { type: String },
  rarity: { type: String },
  images: {
    small: String,
    large: String
  },
  illustrator: { type: String },
  price: {
    cardmarketAvg: { type: Number, default: null },
    tcgplayerMarketPrice: { type: Number, default: null },
    avg: { type: Number, default: 0 }
  },
  nationalPokedexNumber: { type: Number },
  artist: { type: String },
  cardNumber: { type: String },
  marketPrice: { type: Number, default: 0 },
  lastPriceUpdate: { type: Date }
  ,
  category: { type: String, enum: ['pokemon','trainer','energy','unknown'], default: 'pokemon' }
}, { timestamps: true });

/**
 * Modelo de Carta Pokémon exportado
 * @type {mongoose.Model}
 */
export const PokemonCard = mongoose.model('PokemonCard', pokemonCardSchema);
