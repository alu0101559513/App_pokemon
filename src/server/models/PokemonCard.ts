/**
 * @file PokemonCard.ts
 * @description Discriminator de Card para cartas de tipo Pokémon
 *
 * Extiende el modelo base Card añadiendo campos específicos de cartas Pokémon:
 * HP, tipos, ataques, habilidades, debilidades, resistencias, etc.
 *
 * Usa el patrón discriminator de Mongoose, todas las cartas se almacenan
 * en la colección 'cards' con category='pokemon'.
 *
 * @requires mongoose - ODM para MongoDB
 * @requires Card - Modelo base
 */

import mongoose from 'mongoose';
import { Card } from './Card.js';

/**
 * Esquema de Ataque
 * @typedef {Object} Attack
 * @property {string} name - Nombre del ataque
 * @property {Array<string>} cost - Costo energético del ataque
 * @property {string} damage - Daño infligido
 * @property {string} text - Descripción del efecto
 */
const attackSchema = new mongoose.Schema(
  {
    name: String,
    cost: [String],
    damage: String,
    text: String,
  },
  { _id: false }
);

/**
 * Esquema de Habilidad
 * @typedef {Object} Ability
 * @property {string} name - Nombre de la habilidad
 * @property {string} text - Descripción de la habilidad
 * @property {string} type - Tipo de habilidad
 */
const abilitySchema = new mongoose.Schema(
  {
    name: String,
    text: String,
    type: String,
  },
  { _id: false }
);

/**
 * Esquema de Debilidad/Resistencia
 * @typedef {Object} Weakness
 * @property {string} type - Tipo de Pokémon (fuego, agua, etc)
 * @property {string} value - Multiplicador de daño
 */
const weaknessSchema = new mongoose.Schema(
  {
    type: String,
    value: String,
  },
  { _id: false }
);

/**
 * Esquema específico de Carta Pokémon (solo campos únicos)
 *
 * Hereda todos los campos comunes de Card (nombre, set, rarity, images, price, etc.)
 * y añade solo los campos específicos de Pokémon.
 *
 * @typedef {Object} PokemonCardExtension
 * @property {string} subtype - Subtipo de Pokémon (Basic, Stage 1, Stage 2, etc.)
 * @property {string} hp - Puntos de salud
 * @property {Array<string>} types - Tipos del Pokémon (Fire, Water, etc.)
 * @property {string} evolvesFrom - Pokémon anterior en la evolución
 * @property {Array<Ability>} abilities - Habilidades de la carta
 * @property {Array<Attack>} attacks - Ataques disponibles
 * @property {Array<Weakness>} weaknesses - Debilidades de tipos
 * @property {Array<Weakness>} resistances - Resistencias de tipos
 * @property {Array<string>} retreatCost - Costo de retirada
 * @property {number} nationalPokedexNumber - Número en Pokédex Nacional
 */
const pokemonCardSchema = new mongoose.Schema({
  subtype: { type: String },
  hp: { type: String },
  types: [{ type: String }],
  evolvesFrom: { type: String },
  abilities: [abilitySchema],
  attacks: [attackSchema],
  weaknesses: [weaknessSchema],
  resistances: [weaknessSchema],
  retreatCost: [{ type: String }],
  nationalPokedexNumber: { type: Number },
});

/**
 * Modelo de Carta Pokémon como discriminator de Card
 * Automáticamente hereda todos los campos de Card
 * y añade los campos específicos definidos arriba.
 * 
 * category='pokemon' se establece automáticamente
 * 
 * @type {mongoose.Model}
 */
export const PokemonCard = Card.discriminator('pokemon', pokemonCardSchema);
