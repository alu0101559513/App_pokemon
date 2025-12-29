/**
 * @file apiService.ts
 * @description Servicio centralizado para todas las llamadas API REST y tcgDex
 *
 * Proporciona métodos para:
 * - Búsqueda y obtención de cartas
 * - Operaciones CRUD de usuarios
 * - Gestión de trading y solicitudes
 * - Operaciones de colección de cartas
 * - Notificaciones y preferencias
 *
 * URLs de API:
 * - API local: http://localhost:3000
 * - API externa tcgDex: https://api.tcgdex.net/v2/en
 *
 * @requires authService - Servicio de autenticación
 * @module services/apiService
 */

import { types } from 'util';
import {
  PokemonCard,
  ApiResponse,
  PaginatedResponse,
  User,
  TradeStatus,
  UserOwnedCard,
} from '../types';
import { authService } from './authService';

/**
 * URL base de la API local del servidor
 * @constant
 * @type {string}
 */
const API_BASE_URL = 'http://localhost:3000'; // URL base de la API del servidor

/**
 * URL base de la API pública tcgDex
 * @constant
 * @type {string}
 */
const TCGDEX_URL = 'https://api.tcgdex.net/v2/en'; // API pública de tcgDex

/**
 * Obtiene el prefijo alfabético de un código de set
 * Ejemplo: "swsh1" -> "swsh", "base1" -> "ba"
 *
 * @param {string} [setCode] - Código del set
 * @returns {string} Prefijo alfabético
 */
function alphaPrefix(setCode: string | undefined) {
  if (!setCode) return '';
  const m = String(setCode).match(/^[a-zA-Z]+/);
  if (m) return m[0];
  return String(setCode).slice(0, 2);
}

/**
 * Clase que agrupa todas las operaciones de API
 * @class ApiService
 */
class ApiService {
  /**
   * Obtiene las cartas destacadas de la aplicación
   * @async
   * @returns {Promise<PokemonCard[]>} Array de cartas destacadas
   * @example
   * const featured = await apiService.fetchFeaturedCards();
   */
  async fetchFeaturedCards(): Promise<PokemonCard[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/cards/featured`);
      if (!res.ok) throw new Error('Error al obtener cartas destacadas');
      const data: ApiResponse<PokemonCard[]> = await res.json();
      return data.data;
    } catch (err) {
      console.error('Error:', err);
      return [];
    }
  }

  /**
   * Busca cartas en la base de datos local
   * @async
   * @param {string} query - Término de búsqueda
   * @param {number} [page=1] - Número de página
   * @param {number} [limit=20] - Límite de resultados
   * @returns {Promise<PaginatedResponse<PokemonCard>>} Resultados paginados
   */
  async searchCards(
    query: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<PokemonCard>> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/cards/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
      );
      if (!res.ok) throw new Error('Error buscando cartas');
      return await res.json();
    } catch (err) {
      console.error('Error:', err);
      return { data: [], total: 0, page, limit };
    }
  }

  /**
   * Busca cartas en la API tcgDex (datos actualizados en tiempo real)
   * @async
   * @param {string} query - Término de búsqueda
   * @param {number} [page=1] - Número de página
   * @param {number} [limit=20] - Límite de resultados
   * @param {string} [set] - Filtro opcional por set
   * @param {string} [rarity] - Filtro opcional por rareza
   * @returns {Promise<PaginatedResponse<any>>} Resultados de la búsqueda
   */
  async searchTcgCards(
    query: string,
    page = 1,
    limit = 20,
    set?: string,
    rarity?: string
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (set) params.append('set', set);

      if (rarity) params.append('rarity', rarity);
      const res = await fetch(
        `${API_BASE_URL}/cards/search/tcg?${params.toString()}`
      );
      if (!res.ok) throw new Error('Error searching TCGdex');
      return await res.json();
    } catch (err) {
      console.error('Error searchTcgCards:', err);
      return { data: [], total: 0, page, limit };
    }
  }

  async searchTcgQuick(query: string, limit = 10): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      params.append('page', '1');
      params.append('limit', String(limit));
      const res = await fetch(
        `${API_BASE_URL}/cards/search/tcg?${params.toString()}`
      );
      if (!res.ok) throw new Error('Error quick searching TCGdex');
      const payload = await res.json();
      return payload.data || [];
    } catch (err) {
      console.error('Error searchTcgQuick:', err);
      return [];
    }
  }

  async quickSearchCards(query: string): Promise<PokemonCard[]> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/cards/search/quick?q=${encodeURIComponent(query)}`
      );
      if (!res.ok) throw new Error('Error buscando cartas rápidamente');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.error('Error:', err);
      return [];
    }
  }

  async getCardById(id: string): Promise<PokemonCard | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/cards/${id}`);
      if (!res.ok) throw new Error('Error al obtener carta');
      const data: ApiResponse<PokemonCard> = await res.json();
      return data.data;
    } catch (err) {
      console.error('Error:', err);
      return null;
    }
  }

  async fetchFromTcgDex(endpoint: string): Promise<any> {
    try {
      const res = await fetch(`${TCGDEX_URL}/${endpoint}`);
      if (!res.ok) throw new Error('Error al conectar con TCGdex');
      return await res.json();
    } catch (err) {
      console.error('Error:', err);
      return null;
    }
  }

  async getTcgDexSets(): Promise<any[]> {
    return this.fetchFromTcgDex('sets');
  }

  async getCardsFromTcgDexSet(setId: string): Promise<any | null> {
    try {
      const res = await this.fetchFromTcgDex(`sets/${setId}`);
      if (!res) return null;
      // normalize response shape
      let payload = res.data ?? res;
      // some responses nest under `set`
      if (payload.set) payload = payload.set;

      const cards =
        payload.cards ?? payload.data?.cards ?? payload.set?.cards ?? [];
      const images = payload.images ?? payload.image ?? payload.logo ?? {};
      const name = payload.name ?? payload.title ?? payload.setName ?? '';
      const id = payload.id ?? setId;

      return { id, name, images, cards, raw: res };
    } catch (err) {
      console.error('Error fetching set from TCGdex:', err);
      return null;
    }
  }

  async getTcgDexCard(setId: string, cardId: string): Promise<any> {
    return this.fetchFromTcgDex(`sets/${setId}/${cardId}`);
  }

  async addToCollection(userId: string, cardId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/collection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId }),
      });
      return res.ok;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  }

  async removeFromCollection(userId: string, cardId: string): Promise<boolean> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/users/${userId}/collection/${cardId}`,
        { method: 'DELETE' }
      );
      return res.ok;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  }

  async addFriend(userId: string, friendId: string): Promise<User | null> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/users/${userId}/friends/${friendId}`,
        {
          method: 'POST',
        }
      );
      if (!res.ok) throw new Error('Error al añadir amigo');
      const data: ApiResponse<User> = await res.json();
      return data.data;
    } catch (err) {
      console.error('Error al añadir amigo:', err);
      return null;
    }
  }

  async removeFriend(userId: string, friendId: string): Promise<boolean> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/users/${userId}/friends/${friendId}`,
        {
          method: 'DELETE',
        }
      );
      return res.ok;
    } catch (err) {
      console.error('Error al eliminar amigo:', err);
      return false;
    }
  }

  async createTrade(data: {
    initiatorUserId: string;
    receiverUserId: string;
    tradeType?: 'private' | 'public';
    initiatorCards?: any[];
    receiverCards?: any[];
  }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/trades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Error creando el intercambio');
      return await res.json();
    } catch (err) {
      console.error('Error creando trade:', err);
      throw err;
    }
  }

  async getUserTrades(userId: string): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/trades`);
      if (!res.ok) throw new Error('Error obteniendo intercambios del usuario');
      const data: ApiResponse<any[]> = await res.json();
      return data.data;
    } catch (err) {
      console.error('Error:', err);
      return [];
    }
  }

  async updateTradeStatus(tradeId: string, status: TradeStatus): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/trades/${tradeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Error actualizando estado del intercambio');
      return await res.json();
    } catch (err) {
      console.error('Error:', err);
      throw err;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}`);
      if (!res.ok) throw new Error('Error obteniendo usuario');
      const data: ApiResponse<User> = await res.json();
      return data.data;
    } catch (err) {
      console.error('Error:', err);
      return null;
    }
  }

  async getUserFriends(userId: string): Promise<User[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/friends`);
      if (!res.ok) throw new Error('Error obteniendo amigos');
      const data: ApiResponse<User[]> = await res.json();
      return data.data;
    } catch (err) {
      console.error('Error:', err);
      return [];
    }
  }

  async getWishlist(userId: string): Promise<PokemonCard[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/wishlist`);
      if (!res.ok) throw new Error('Error obteniendo wishlist');
      const data: ApiResponse<PokemonCard[]> = await res.json();
      return data.data;
    } catch (err) {
      console.error('Error:', err);
      return [];
    }
  }

  async addToWishlist(userId: string, cardId: string): Promise<boolean> {
    try {
      // Add card to user's cards with collectionType=wishlist.
      const res = await fetch(`${API_BASE_URL}/users/${userId}/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
        },
        body: JSON.stringify({
          pokemonTcgId: cardId,
          collectionType: 'wishlist',
          autoFetch: true,
        }),
      });
      return res.ok;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  }

  async addCardToUserCollectionByTcgId(
    userId: string,
    pokemonTcgId: string
  ): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
        },
        body: JSON.stringify({
          pokemonTcgId,
          collectionType: 'collection',
          autoFetch: true,
        }),
      });
      return res.ok;
    } catch (err) {
      console.error('Error adding card to collection:', err);
      return false;
    }
  }

  async removeFromWishlist(userId: string, cardId: string): Promise<boolean> {
    try {
      // The server exposes deletion by userCard id under /usercards/:username/cards/:userCardId
      // We need to lookup the user's wishlist entries, find the matching userCard (by pokemonTcgId or cardId.pokemonTcgId)
      // and then call the existing delete route.
      const listRes = await fetch(
        `${API_BASE_URL}/usercards/${userId}/wishlist`
      );
      if (!listRes.ok) {
        // fallback: try the user-scoped endpoint
        const fallback = await fetch(
          `${API_BASE_URL}/users/${userId}/cards?collection=wishlist`
        );
        if (!fallback.ok) return false;
        const fallbackPayload = await fallback.json();
        const items = fallbackPayload.cards || fallbackPayload.results || [];
        const found = items.find(
          (it: any) =>
            it.pokemonTcgId === cardId ||
            (it.cardId && it.cardId.pokemonTcgId === cardId)
        );
        if (!found) return false;
        const delRes = await fetch(
          `${API_BASE_URL}/users/${userId}/cards/${found._id}`,
          {
            method: 'DELETE',
            headers: { ...authService.getAuthHeaders() },
          }
        );
        return delRes.ok;
      }

      const payload = await listRes.json();
      const items = payload.cards || payload.results || [];
      const found = items.find(
        (it: any) =>
          it.pokemonTcgId === cardId ||
          (it.cardId && it.cardId.pokemonTcgId === cardId)
      );
      if (!found) return false;

      const delRes = await fetch(
        `${API_BASE_URL}/usercards/${userId}/cards/${found._id}`,
        {
          method: 'DELETE',
          headers: { ...authService.getAuthHeaders() },
        }
      );
      return delRes.ok;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  }

  async getUserWishlist(username: string): Promise<UserOwnedCard[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/usercards/${username}/wishlist`);
      if (!res.ok) throw new Error('Error obteniendo wishlist del usuario');

      const data = await res.json();

      const results = [] as any[];
      // Collect items and batch-fetch missing cached cards with limited concurrency
      const items = data.cards || [];
      // build list of tcgIds we need to fetch
      const missingIds: string[] = [];
      const itemCardMap = new Map<number, any>();
      items.forEach((item: any, idx: number) => {
        const card = item.cardId || {};
        if ((!card || Object.keys(card).length === 0) && item.pokemonTcgId) {
          missingIds.push(item.pokemonTcgId);
        }
        itemCardMap.set(idx, card);
      });

      // helper: fetch cached cards in batches to avoid opening too many simultaneous connections
      const fetchCached = async (ids: string[]) => {
        const map: Record<string, any> = {};
        const concurrency = 8;
        for (let i = 0; i < ids.length; i += concurrency) {
          const batch = ids.slice(i, i + concurrency);
          const promises = batch.map((id) =>
            fetch(`${API_BASE_URL}/cards/tcg/${id}`)
              .then((r) => (r.ok ? r.json().catch(() => null) : null))
              .catch(() => null)
          );
          const resolved = await Promise.all(promises);
          resolved.forEach((payload, j) => {
            const id = batch[j];
            if (payload) map[id] = payload.card ?? payload;
          });
        }
        return map;
      };

      const cachedById = missingIds.length
        ? await fetchCached(Array.from(new Set(missingIds)))
        : {};

      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        let card = itemCardMap.get(idx) || {};
        if ((!card || Object.keys(card).length === 0) && item.pokemonTcgId) {
          card = cachedById[item.pokemonTcgId] || {};
        }

        // derive image from multiple possible shapes
        let image = card.imageUrl || card.imageUrlHiRes || card.image || '';
        if (!image && card.images) {
          image = card.images.large || card.images.small || '';
        }

        const tcgId = item.pokemonTcgId || card.pokemonTcgId || '';
        if (!image && tcgId) {
          const [setCode, number] = tcgId.split('-');
          const series = alphaPrefix(setCode);
          if (setCode && number) {
            image = `https://assets.tcgdex.net/en/${series}/${setCode}/${number}/high.png`;
          }
        }

        results.push({
          id: item._id,
          name: card.name,
          image,
          rarity: card.rarity,
          forTrade: item.forTrade,
          pokemonTcgId: tcgId,
        });
      }

      return results;
    } catch (err) {
      console.error('Error wishlist:', err);
      return [];
    }
  }

  async getUserCollection(username: string): Promise<UserOwnedCard[]> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/usercards/${username}/collection`
      );
      if (!res.ok) throw new Error('Error obteniendo colección del usuario');

      const data = await res.json();

      const results = [] as any[];
      // Batch-fetch missing cached cards to avoid sequential fetches per item
      const items = data.cards || [];
      const missingIds: string[] = [];
      const itemCardMap = new Map<number, any>();
      items.forEach((item: any, idx: number) => {
        const card = item.cardId || {};
        if ((!card || Object.keys(card).length === 0) && item.pokemonTcgId)
          missingIds.push(item.pokemonTcgId);
        itemCardMap.set(idx, card);
      });

      const fetchCached = async (ids: string[]) => {
        const map: Record<string, any> = {};
        const concurrency = 8;
        for (let i = 0; i < ids.length; i += concurrency) {
          const batch = ids.slice(i, i + concurrency);
          const promises = batch.map((id) =>
            fetch(`${API_BASE_URL}/cards/tcg/${id}`)
              .then((r) => (r.ok ? r.json().catch(() => null) : null))
              .catch(() => null)
          );
          const resolved = await Promise.all(promises);
          resolved.forEach((payload, j) => {
            const id = batch[j];
            if (payload) map[id] = payload.card ?? payload;
          });
        }
        return map;
      };

      const cachedById = missingIds.length
        ? await fetchCached(Array.from(new Set(missingIds)))
        : {};

      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        let card = itemCardMap.get(idx) || {};
        if ((!card || Object.keys(card).length === 0) && item.pokemonTcgId) {
          card = cachedById[item.pokemonTcgId] || {};
        }

        let image = card.imageUrl || card.imageUrlHiRes || card.image || '';
        if (!image && card.images) {
          image = card.images.large || card.images.small || '';
        }

        const tcgId = item.pokemonTcgId || card.pokemonTcgId || '';
        if (!image && tcgId) {
          const [setCode, number] = tcgId.split('-');
          const series = alphaPrefix(setCode);
          if (setCode && number) {
            image = `https://assets.tcgdex.net/en/${series}/${setCode}/${number}/high.png`;
          }
        }

        results.push({
          id: item._id,
          name: card.name,
          image,
          set: card.set,
          types: card.types,
          category: card.category,
          rarity: card.rarity,
          price: card.price,
          forTrade: item.forTrade,
          pokemonTcgId: tcgId,
        });
      }

      return results;
    } catch (err) {
      console.error('Error colección:', err);
      return [];
    }
  }

  /**
   * Update a userCard fields (PATCH /users/:username/cards/:userCardId)
   * Returns true on success
   */
  async updateUserCard(
    username: string,
    userCardId: string,
    updates: Record<string, any>
  ): Promise<boolean> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/users/${username}/cards/${userCardId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...authService.getAuthHeaders(),
          },
          body: JSON.stringify(updates),
        }
      );
      return res.ok;
    } catch (err) {
      console.error('Error updating userCard:', err);
      return false;
    }
  }

  async getCachedCardByTcgId(pokemonTcgId: string): Promise<any | null> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/cards/tcg/${encodeURIComponent(pokemonTcgId)}`
      );
      if (!res.ok) return null;
      const payload = await res.json().catch(() => null);
      // the server may return { card } or the card directly
      return payload?.card ?? payload ?? null;
    } catch (err) {
      console.error('Error fetching cached card:', err);
      return null;
    }
  }
}

export default new ApiService();
