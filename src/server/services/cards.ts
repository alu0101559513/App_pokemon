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
import { sanitizeBriefCard, getCardCategory, extractPrices } from '../services/tcgdx.js';

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
        const c = sanitizeBriefCard(raw);
        const category = getCardCategory(c);

        try {
          if (category === 'pokemon') {
            // extract prices from the original raw API object to avoid losing nested pricing
            const prices = extractPrices(raw);
            await PokemonCard.findOneAndUpdate(
              { pokemonTcgId: c.id },
              {
                pokemonTcgId: c.id,
                name: c.name,
                supertype: c.supertype || '',
                subtype: c.subtype || '',
                hp: c.hp || '',
                types: c.types || [],
                evolvesFrom: c.evolvesFrom || '',
                abilities: c.abilities || [],
                attacks: c.attacks || [],
                weaknesses: c.weaknesses || [],
                resistances: c.resistances || [],
                retreatCost: c.retreat || c.retreatCost || [],
                series: c.set?.series || '',
                set: c.set?.name || '',
                rarity: c.rarity || '',
                images: { small: c.images?.small || '', large: c.images?.large || '' },
                illustrator: c.illustrator || c.artist || '',
                price: {
                  cardmarketAvg: prices.cardmarketAvg,
                  tcgplayerMarketPrice: prices.tcgplayerMarketPrice,
                  avg: prices.avg ?? 0
                },
                nationalPokedexNumber: c.nationalPokedexNumbers?.[0] || null,
                artist: c.artist || '',
                cardNumber: c.number || '',
                lastPriceUpdate: new Date()
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          } else if (category === 'trainer') {
            const prices = extractPrices(raw);
            await TrainerCard.findOneAndUpdate(
              { pokemonTcgId: c.id },
              {
                pokemonTcgId: c.id,
                name: c.name,
                supertype: c.supertype || '',
                subtype: c.subtype || '',
                series: c.set?.series || '',
                set: c.set?.name || '',
                rarity: c.rarity || '',
                images: { small: c.images?.small || '', large: c.images?.large || '' },
                illustrator: c.illustrator || c.artist || '',
                price: {
                  cardmarketAvg: prices.cardmarketAvg,
                  tcgplayerMarketPrice: prices.tcgplayerMarketPrice,
                  avg: prices.avg ?? 0
                },
                text: Array.isArray(c.text) ? c.text.join('\n') : c.text || '',
                effect: c.effect || '',
                artist: c.artist || '',
                cardNumber: c.number || '',
                lastPriceUpdate: new Date()
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          } else if (category === 'energy') {
            const prices = extractPrices(raw);
            await EnergyCard.findOneAndUpdate(
              { pokemonTcgId: c.id },
              {
                pokemonTcgId: c.id,
                name: c.name,
                supertype: c.supertype || '',
                subtype: c.subtype || '',
                energyType: c?.energyType || (c?.subtype || ''),
                series: c.set?.series || '',
                set: c.set?.name || '',
                rarity: c.rarity || '',
                images: { small: c.images?.small || '', large: c.images?.large || '' },
                illustrator: c.illustrator || c.artist || '',
                price: {
                  cardmarketAvg: prices.cardmarketAvg,
                  tcgplayerMarketPrice: prices.tcgplayerMarketPrice,
                  avg: prices.avg ?? 0
                },
                text: Array.isArray(c.text) ? c.text.join('\n') : c.text || '',
                artist: c.artist || '',
                cardNumber: c.number || '',
                lastPriceUpdate: new Date()
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          } else {
            // fallback to existing generic Card model for unknown types
            const prices = extractPrices(raw);
            await Card.findOneAndUpdate(
              { pokemonTcgId: c.id },
              {
                pokemonTcgId: c.id,
                name: c.name,
                series: c.set?.series || '',
                set: c.set?.name || '',
                rarity: c.rarity || '',
                types: c.types || [],
                imageUrl: c.images?.small || '',
                imageUrlHiRes: c.images?.large || '',
                illustrator: c.illustrator || c.artist || '',
                price: {
                  cardmarketAvg: prices.cardmarketAvg,
                  tcgplayerMarketPrice: prices.tcgplayerMarketPrice,
                  avg: prices.avg ?? 0
                },
                nationalPokedexNumber: c.nationalPokedexNumbers?.[0] || null,
                artist: c.artist || '',
                cardNumber: c.number || '',
                lastPriceUpdate: new Date()
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          }

          count++;
        } catch (err) {
          console.error(`Error saving card ${c?.id || c?.name}:`, (err as Error).message ?? String(err));
        }
      }
    } catch (error) {
      console.error(`Error al sincronizar el set ${setId}:`, (error as Error).message ?? String(error));
    }
  }

  console.log(`Sincronización completada. Total de cartas procesadas: ${count}`);
  return count;
}

/**
 * Inserta/actualiza una carta a partir del objeto crudo devuelto por la API externa.
 * Devuelve el documento guardado en la colección especializada (PokemonCard/TrainerCard/EnergyCard)
 * o en `Card` como fallback.
 */
export async function upsertCardFromRaw(raw: any) {
  const data = raw?.data ?? raw;
  const brief = Array.isArray(data) ? data[0] : data;
  if (!brief) return null;

  const prices = extractPrices(raw);
  const c = sanitizeBriefCard(brief);
  const category = getCardCategory(c);

  let saved: any = null;

  if (category === 'pokemon') {
    saved = await PokemonCard.findOneAndUpdate(
      { pokemonTcgId: c.id },
      {
        pokemonTcgId: c.id,
        name: c.name,
        supertype: c.supertype || '',
        subtype: c.subtype || '',
        hp: c.hp || '',
        types: c.types || [],
        evolvesFrom: c.evolvesFrom || '',
        abilities: c.abilities || [],
        attacks: c.attacks || [],
        weaknesses: c.weaknesses || [],
        resistances: c.resistances || [],
        retreatCost: c.retreat || c.retreatCost || [],
        series: c.set?.series || '',
        set: c.set?.name || '',
        rarity: c.rarity || '',
        images: { small: c.images?.small || '', large: c.images?.large || '' },
        illustrator: c.illustrator || c.artist || '',
        price: {
          cardmarketAvg: prices.cardmarketAvg,
          tcgplayerMarketPrice: prices.tcgplayerMarketPrice,
          avg: prices.avg ?? 0
        },
        nationalPokedexNumber: c.nationalPokedexNumbers?.[0] || null,
        artist: c.artist || '',
        cardNumber: c.number || '',
        lastPriceUpdate: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } else if (category === 'trainer') {
    saved = await TrainerCard.findOneAndUpdate(
      { pokemonTcgId: c.id },
      {
        pokemonTcgId: c.id,
        name: c.name,
        supertype: c.supertype || '',
        subtype: c.subtype || '',
        series: c.set?.series || '',
        set: c.set?.name || '',
        rarity: c.rarity || '',
        images: { small: c.images?.small || '', large: c.images?.large || '' },
        illustrator: c.illustrator || c.artist || '',
        price: {
          cardmarketAvg: prices.cardmarketAvg,
          tcgplayerMarketPrice: prices.tcgplayerMarketPrice,
          avg: prices.avg ?? 0
        },
        text: Array.isArray(c.text) ? c.text.join('\n') : c.text || '',
        effect: c.effect || '',
        artist: c.artist || '',
        cardNumber: c.number || '',
        lastPriceUpdate: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } else if (category === 'energy') {
    saved = await EnergyCard.findOneAndUpdate(
      { pokemonTcgId: c.id },
      {
        pokemonTcgId: c.id,
        name: c.name,
        supertype: c.supertype || '',
        subtype: c.subtype || '',
        energyType: c?.energyType || (c?.subtype || ''),
        series: c.set?.series || '',
        set: c.set?.name || '',
        rarity: c.rarity || '',
        images: { small: c.images?.small || '', large: c.images?.large || '' },
        illustrator: c.illustrator || c.artist || '',
        price: {
          cardmarketAvg: prices.cardmarketAvg,
          tcgplayerMarketPrice: prices.tcgplayerMarketPrice,
          avg: prices.avg ?? 0
        },
        text: Array.isArray(c.text) ? c.text.join('\n') : c.text || '',
        artist: c.artist || '',
        cardNumber: c.number || '',
        lastPriceUpdate: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } else {
    saved = await Card.findOneAndUpdate(
      { pokemonTcgId: c.id },
      {
        pokemonTcgId: c.id,
        name: c.name,
        series: c.set?.series || '',
        set: c.set?.name || '',
        rarity: c.rarity || '',
        types: c.types || [],
        imageUrl: c.images?.small || '',
        imageUrlHiRes: c.images?.large || '',
        illustrator: c.illustrator || c.artist || '',
        price: {
          cardmarketAvg: prices.cardmarketAvg,
          tcgplayerMarketPrice: prices.tcgplayerMarketPrice,
          avg: prices.avg ?? 0
        },
        nationalPokedexNumber: c.nationalPokedexNumbers?.[0] || null,
        artist: c.artist || '',
        cardNumber: c.number || '',
        lastPriceUpdate: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  return saved;
}
