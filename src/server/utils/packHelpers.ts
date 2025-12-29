/**
 * @file packHelpers.ts
 * @description Helpers para operaciones de sobres (packs) con token-bucket rate limiting
 * 
 * Centraliza la lógica de:
 * - Cálculo de tokens disponibles
 * - Validación de rate limiting
 * - Refill automático de tokens
 * - Generación de cartas para packs
 */

import { Response } from 'express';
import { RARITY_ORDER } from '../constants/pokemon.js';

const MS_HOUR = 1000 * 60 * 60;
const REFILL_MS = 12 * MS_HOUR;
const MAX_TOKENS = 2;

/**
 * Calcula los tokens disponibles y el siguiente tiempo permitido
 * Implementa token-bucket rate limiting: max 2 opens per 24h, refill cada 12h
 * 
 * @param user - Usuario con packTokens y packLastRefill
 * @returns { tokens, nextAllowed, now }
 */
export function computePackTokens(user: any) {
  const now = Date.now();
  
  // Ensure fields exist
  if (
    typeof (user as any).packTokens !== 'number' ||
    !(user as any).packLastRefill
  ) {
    (user as any).packTokens = MAX_TOKENS;
    (user as any).packLastRefill = new Date();
  }
  
  const lastRefill = new Date((user as any).packLastRefill).getTime();
  const refillCount = Math.floor((now - lastRefill) / REFILL_MS);
  
  if (refillCount > 0) {
    (user as any).packTokens = Math.min(
      MAX_TOKENS,
      ((user as any).packTokens || 0) + refillCount
    );
    (user as any).packLastRefill = new Date(
      lastRefill + refillCount * REFILL_MS
    );
  }
  
  // Calcular nextAllowed siempre que no tengamos el máximo de tokens
  let nextAllowed: Date | null = null;
  const currentTokens = (user as any).packTokens || 0;
  
  if (currentTokens < MAX_TOKENS) {
    const updatedLastRefill = new Date((user as any).packLastRefill).getTime();
    nextAllowed = new Date(updatedLastRefill + REFILL_MS);
  }
  
  return {
    tokens: currentTokens,
    nextAllowed,
    now,
  };
}

/**
 * Valida si el usuario tiene tokens disponibles
 * @param user - Usuario con información de tokens
 * @param res - Response object para enviar error si no hay tokens
 * @returns true si hay tokens, false si no
 */
export function validatePackTokens(user: any, res: Response): boolean {
  const { tokens, nextAllowed } = computePackTokens(user);
  
  if (tokens <= 0) {
    return res.status(429).send({
      error: 'No quedan tokens para abrir sobres. Espera para recargar.',
      nextAllowed,
    }) as any;
  }
  
  return true;
}

/**
 * Consume un token y guarda el estado en el usuario
 * @param user - Usuario
 * @returns true si se consumió correctamente
 */
export async function consumePackToken(user: any): Promise<boolean> {
  const { tokens } = computePackTokens(user);
  if (tokens <= 0) return false;
  
  (user as any).packTokens = Math.max(0, tokens - 1);
  await user.save();
  return true;
}

/**
 * Obtiene el recuento de packs abiertos en últimas 24 horas
 * @param PackOpen - Modelo PackOpen
 * @param userId - ID del usuario
 * @returns Número de packs abiertos
 */
export async function getPackOpenCount24h(PackOpen: any, userId: any): Promise<number> {
  const now = Date.now();
  const dayAgo = new Date(now - 24 * MS_HOUR);
  
  return await PackOpen.countDocuments({
    userId,
    createdAt: { $gte: dayAgo },
  });
}

/**
 * Selecciona un elemento aleatorio de un array
 * @param arr - Array de elementos
 * @returns Elemento aleatorio del array
 */
export function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Genera un pack de 10 cartas: 9 aleatorias + 1 rara
 * 
 * @param cards - Array de cartas disponibles del set
 * @returns Array de 10 cartas seleccionadas
 * 
 * @example
 * const pack = generatePackCards(setCards);
 */
export function generatePackCards(cards: any[]): any[] {
  // Seleccionar 9 cartas aleatorias
  const chosen: any[] = [];
  const pool = [...cards];
  
  for (let i = 0; i < 9; i++) {
    if (pool.length === 0) break;
    const idx = Math.floor(Math.random() * pool.length);
    chosen.push(pool.splice(idx, 1)[0]);
  }
  
  // Seleccionar 1 carta rara o superior
  const rarityIndex = RARITY_ORDER.indexOf('Rare');
  const rarePool = cards.filter((c: any) => {
    const r = (c.rarity || c.rarityText || '').toString();
    const idx = RARITY_ORDER.findIndex(
      (x) => x.toLowerCase() === r.toLowerCase()
    );
    return idx >= 0 && idx >= rarityIndex;
  });
  
  const last = rarePool.length > 0 ? getRandomElement(rarePool) : getRandomElement(cards);
  
  return [...chosen, last];
}
