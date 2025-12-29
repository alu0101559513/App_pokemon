/**
 * @file cards.ts
 * @description Servicio de sincronización y gestión de cartas en la base de datos
 *
 * Proporciona funciones para:
 * - Sincronizar cartas desde la API externa a MongoDB
 * - Actualizar información de cartas
 * - Crear nuevas cartas desde datos RAW de la API
 * - Normalizar y sanitizar datos de cartas
 *
 * @requires Card - Modelo genérico de cartas
 * @requires PokemonCard - Modelo de cartas Pokémon
 * @requires TrainerCard - Modelo de cartas Entrenador
 * @requires EnergyCard - Modelo de cartas Energía
 */

import { Card } from '../models/Card.js';
import { PokemonCard } from '../models/PokemonCard.js';
import { TrainerCard } from '../models/TrainerCard.js';
import { EnergyCard } from '../models/EnergyCard.js';
import { getAllSets, getCardsBySet } from './pokemon.js';
import { getCardCategory } from './tcgdx.js';
import {
  buildPokemonCardData,
  buildTrainerCardData,
  buildEnergyCardData,
  buildGenericCardData,
} from './cardDataBuilder.js';

/**
 * Sincroniza todas las cartas desde la API externa hacia la base de datos local
 * Itera por todos los sets disponibles en TCGdex y guarda cada carta en su modelo específico
 *
 * @async
 * @returns {Promise<number>} El número total de cartas procesadas
 * @throws {Error} Si hay problemas en la sincronización
 *
 * @example
 * const count = await syncAllCards();
 * console.log(`${count} cartas sincronizadas`);
 */
export async function syncAllCards() {
  console.log('Iniciando sincronización de cartas');

  const setsResponse = await getAllSets();
  const sets = setsResponse.data ?? setsResponse;

  let count = 0;

  for (const set of sets) {
    const setId = set.id || set.code;
    console.log(`Sincronizando set: ${setId}...`);

    try {
      const cardsResponse = await getCardsBySet(setId);
      const cards = cardsResponse.data ?? cardsResponse;

      for (const raw of cards) {
        try {
          await upsertCardFromRaw(raw);
          count++;
        } catch (err) {
          console.error(
            `Error saving card ${raw?.id || raw?.name}:`,
            (err as Error).message ?? String(err)
          );
        }
      }
    } catch (error) {
      console.error(
        `Error al sincronizar el set ${setId}:`,
        (error as Error).message ?? String(error)
      );
    }
  }

  console.log(
    `Sincronización completada. Total de cartas procesadas: ${count}`
  );
  return count;
}

/**
 * Inserta/actualiza una carta a partir del objeto crudo devuelto por la API externa.
 * Devuelve el documento guardado en la colección especializada (PokemonCard/TrainerCard/EnergyCard)
 * o en `Card` como fallback.
 * 
 * @param raw - Objeto raw de la API TCGdex
 * @returns Documento guardado en MongoDB o null si falla
 */
export async function upsertCardFromRaw(raw: any) {
  const data = raw?.data ?? raw;
  const brief = Array.isArray(data) ? data[0] : data;
  if (!brief) return null;

  const category = getCardCategory(brief);

  try {
    switch (category) {
      case 'pokemon': {
        const cardData = buildPokemonCardData(raw);
        return await PokemonCard.findOneAndUpdate(
          { pokemonTcgId: cardData.pokemonTcgId },
          cardData,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }

      case 'trainer': {
        const cardData = buildTrainerCardData(raw);
        return await TrainerCard.findOneAndUpdate(
          { pokemonTcgId: cardData.pokemonTcgId },
          cardData,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }

      case 'energy': {
        const cardData = buildEnergyCardData(raw);
        return await EnergyCard.findOneAndUpdate(
          { pokemonTcgId: cardData.pokemonTcgId },
          cardData,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }

      default: {
        const cardData = buildGenericCardData(raw);
        return await Card.findOneAndUpdate(
          { pokemonTcgId: cardData.pokemonTcgId },
          cardData,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }
  } catch (error) {
    console.error(
      `Error upserting card ${brief?.id || brief?.name}:`,
      (error as Error).message ?? String(error)
    );
    return null;
  }
}
