/**
 * @file pokemon.ts
 * @description Servicio de integración con API TCGdex para cartas Pokémon
 *
 * Proporciona funciones para obtener datos de cartas desde la API pública TCGdex.net.
 * Actúa como capa intermedia entre la aplicación y la API externa.
 *
 * Base URL: https://api.tcgdex.net/v2/en
 *
 * @requires fetch - API de Node.js para solicitudes HTTP
 */

// services/pokemon.ts

/**
 * URL base de la API TCGdex
 * @constant
 * @type {string}
 */
const TCGDEX_BASE_URL = 'https://api.tcgdex.net/v2/en';

/**
 * Función auxiliar para hacer fetches a la API TCGdex
 * Maneja errores y retorna JSON automáticamente
 *
 * @param {string} endpoint - Endpoint relativo (ej: "/cards", "/sets/swsh3")
 * @returns {Promise<any>} Respuesta JSON de la API
 * @throws {Error} Si la respuesta no es 200 OK
 */
async function apiFetch(endpoint: string) {
  const response = await fetch(`${TCGDEX_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`TCGdex API Error: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Obtiene cartas por nombre
 * @param {string} name - Nombre del Pokémon a buscar
 * @returns {Promise<Array>} Array de cartas que coinciden con el nombre
 */
export async function getCardsByName(name: string) {
  return apiFetch(`/cards?name=${encodeURIComponent(name)}`);
}

/**
 * Obtiene una carta específica por ID
 * @param {string} id - ID de la carta (ej: "swsh3-25")
 * @returns {Promise<Object>} Detalles completos de la carta
 */
export async function getCardById(id: string) {
  return apiFetch(`/cards/${id}`);
}

/**
 * Obtiene todas las cartas de un set específico
 * @param {string} setId - ID del set (ej: "swsh3", "base1")
 * @returns {Promise<Array>} Array de cartas del set
 */
export async function getCardsBySet(setId: string) {
  return apiFetch(`/sets/${setId}`);
}

/**
 * Obtiene la lista de todos los sets disponibles
 * @returns {Promise<Array>} Array de sets con información básica
 */
export async function getAllSets() {
  return apiFetch('/sets');
}

/**
 * Obtiene cartas filtradas por tipo
 * @param type - Tipo de carta (ej: "Pokémon", "Trainer", "Energy")
 * @returns Array de cartas del tipo especificado
 */
export async function getCardsByType(type: string) {
  return apiFetch(`/cards?types=${encodeURIComponent(type)}`);
}

/**
 * Obtiene cartas filtradas por HP
 * @param hp - HP mínimo o exacto
 * @returns Array de cartas con ese HP
 */
export async function getCardsByHP(hp: number) {
  return apiFetch(`/cards?hp=${hp}`);
}

/**
 * Obtiene cartas por rareza
 * @param rarity - Rareza de la carta (ej: "Common", "Rare", "Ultra Rare")
 * @returns Array de cartas con esa rareza
 */
export async function getCardsByRarity(rarity: string) {
  return apiFetch(`/cards?rarity=${encodeURIComponent(rarity)}`);
}

/**
 * Obtiene información de una serie específica
 * @param seriesId - ID de la serie
 * @returns Información de la serie
 */
export async function getSeriesById(seriesId: string) {
  return apiFetch(`/series/${seriesId}`);
}

/**
 * Obtiene todas las series disponibles
 * @returns Array de series
 */
export async function getAllSeries() {
  return apiFetch('/series');
}

/**
 * Búsqueda avanzada de cartas con múltiples filtros
 * @param filters - Objeto con filtros opcionales (name, types, hp, rarity, etc.)
 * @returns Array de cartas que cumplen los filtros
 */
export async function searchCards(filters: {
  name?: string;
  types?: string;
  hp?: number;
  rarity?: string;
  set?: string;
}) {
  const params = new URLSearchParams();

  if (filters.name) params.append('name', filters.name);
  if (filters.types) params.append('types', filters.types);
  if (filters.hp) params.append('hp', filters.hp.toString());
  if (filters.rarity) params.append('rarity', filters.rarity);
  if (filters.set) params.append('set', filters.set);

  const queryString = params.toString();
  return apiFetch(`/cards${queryString ? `?${queryString}` : ''}`);
}
