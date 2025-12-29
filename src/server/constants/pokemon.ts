/**
 * @file pokemon.ts
 * @description Constantes relacionadas con Pokémon TCG
 * 
 * Define valores constantes usados en toda la aplicación para lógica de cartas
 */

/**
 * Orden de raridades para selección de cartas en packs
 * Ordenado de menor a mayor rareza
 * 
 * @constant
 * @type {string[]}
 */
export const RARITY_ORDER = [
  'Common',
  'Uncommon',
  'Rare',
  'Holo Rare',
  'Rare Holo',
  'Ultra Rare',
  'Secret Rare',
] as const;

/**
 * Tipo para raridades válidas
 */
export type CardRarity = typeof RARITY_ORDER[number];
