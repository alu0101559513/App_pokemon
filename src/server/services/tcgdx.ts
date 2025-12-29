/**
 * @file tcgdx.ts
 * @description Utilidades para procesar respuestas de la API TCGdex
 *
 * Proporciona funciones para:
 * - Sanitizar datos removiendo referencias circulares
 * - Determinar la categoría de la carta
 * - Extraer precios de diferentes mercados
 * - Normalizar URLs de imágenes
 *
 * @module services/tcgdx
 */

/**
 * Sanitiza objetos de tarjeta removiendo referencias circulares
 * Convierte el objeto a JSON y de vuelta a un objeto limpio
 *
 * @template T
 * @param {T} input - Objeto de carta a sanitizar
 * @returns {T} Objeto sanitizado sin referencias circulares
 *
 * @example
 * const sanitized = sanitizeBriefCard(rawCardData);
 */
export function sanitizeBriefCard<T extends Record<string, any>>(input: T): T {
  // JSON.stringify with a replacer that removes circular references
  const seen = new WeakSet();

  function replacer(_key: string, value: any) {
    if (value && typeof value === 'object') {
      if (seen.has(value)) {
        // drop circular reference
        return undefined;
      }
      seen.add(value);
    }
    return value;
  }

  try {
    const str = JSON.stringify(input, replacer);
    return JSON.parse(str) as T;
  } catch (err) {
    // If serialization failed for any unexpected reason, fall back to a shallow clone
    const out: any = {};
    for (const k of Object.keys(input)) {
      const v = (input as any)[k];
      if (v && typeof v === 'object') {
        try {
          out[k] = JSON.parse(JSON.stringify(v));
        } catch {
          out[k] = undefined;
        }
      } else {
        out[k] = v;
      }
    }
    return out as T;
  }
}

/**
 * Determina la categoría de una carta basándose en su tipo
 * Analiza el campo supertype para clasificar la carta
 *
 * @param {Object} card - Objeto de carta de la API
 * @returns {'pokemon'|'trainer'|'energy'|'unknown'} Categoría de la carta
 *
 * @example
 * const category = getCardCategory(cardData);
 * // Returns: 'pokemon' | 'trainer' | 'energy' | 'unknown'
 */
export function getCardCategory(
  card: Record<string, any>
): 'pokemon' | 'trainer' | 'energy' | 'unknown' {
  const supertype = (card?.supertype || card?.type || '')
    .toString()
    .toLowerCase();
  if (supertype.includes('pokemon')) return 'pokemon';
  if (supertype.includes('trainer')) return 'trainer';
  if (supertype.includes('energy')) return 'energy';
  // fallback: if `types` exists it's likely a Pokemon card
  if (Array.isArray(card?.types) && card.types.length > 0) return 'pokemon';
  return 'unknown';
}

/**
 * Normaliza una URL de imagen para apuntar a la versión de alta resolución.
 * 
 * Maneja casos especiales:
 * - Corrige URLs de TCGdex que faltan la serie: /jp/swsh1/ → /en/swsh/swsh1/
 * - Cambia idioma de jp a en (solo queremos cartas en inglés)
 * - Reemplaza /small.png, /large.png, /low.png por /high.png
 * 
 * @param url - URL de imagen a normalizar
 * @returns URL normalizada apuntando a versión high.png
 * 
 * @example
 * normalizeImageUrl('https://assets.tcgdex.net/jp/swsh1/25/low.png')
 * // => 'https://assets.tcgdex.net/en/swsh/swsh1/25/high.png'
 */
export function normalizeImageUrl(url?: string | null): string {
  if (!url) return '';
  let s = String(url).trim();
  
  // Corregir URLs de TCGdex que les falta la serie entre idioma y set
  // Formato incorrecto: .../jp/swsh1/25/high.png
  // Formato correcto: .../en/swsh/swsh1/25/high.png
  const tcgdexMatch = s.match(/^(https?:\/\/assets\.tcgdex\.net\/)(?:jp|en)\/([a-z0-9.]+)\/(.+)$/i);
  if (tcgdexMatch) {
    const [, baseUrl, setCode, rest] = tcgdexMatch;
    
    // Extraer la serie del setCode (swsh1 → swsh, sm1 → sm, xy1 → xy, base1 → base)
    const seriesMatch = setCode.match(/^([a-z]+)/i);
    if (seriesMatch) {
      const series = seriesMatch[1].toLowerCase();
      // Reconstruir URL correcta: {baseUrl}en/{serie}/{set}/{resto}
      s = `${baseUrl}en/${series}/${setCode.toLowerCase()}/${rest}`;
    }
  }
  
  // Reemplazar extensiones conocidas por /high.png
  if (/\/(?:small|large|low)\.png$/i.test(s)) {
    return s.replace(/\/(?:small|large|low)\.png$/i, '/high.png');
  }
  
  // Si ya termina con /high.png, está correcta
  if (/\/high\.png$/i.test(s)) return s;
  
  // Si ya tiene una extensión de imagen, mantenerla
  if (/\.(png|jpe?g|gif|webp)$/i.test(s)) return s;
  
  // Caso por defecto: añadir /high.png
  return s.endsWith('/') ? `${s}high.png` : `${s}/high.png`;
}

/**
 * Extract price information from a TCGdex brief card object.
 * Tries multiple common shapes and returns cardmarketAvg, tcgplayerMarketPrice and a chosen avg.
 */
export function extractPrices(card: Record<string, any>) {
  let cardmarketAvg: number | null = null;
  let tcgplayerMarketPrice: number | null = null;

  // TCGdex 'pricing' structure (observed): pricing.cardmarket.avg, pricing.tcgplayer.holofoil.marketPrice
  if (card?.pricing?.cardmarket) {
    const cm = card.pricing.cardmarket;
    cardmarketAvg = cm?.avg ?? cm?.average ?? cm?.avg ?? null;
  }

  // tcgplayer nested under pricing.tcgplayer.holofoil or pricing.tcgplayer
  if (card?.pricing?.tcgplayer) {
    const t = card.pricing.tcgplayer;
    // try holofoil.marketPrice, then midPrice or marketPrice
    tcgplayerMarketPrice =
      t?.holofoil?.marketPrice ??
      t?.holofoil?.midPrice ??
      t?.marketPrice ??
      t?.midPrice ??
      null;
  }

  // older/other shapes
  if (card?.cardmarket) {
    const cm = card.cardmarket;
    cardmarketAvg =
      cardmarketAvg ??
      cm?.prices?.avg ??
      cm?.prices?.average ??
      cm?.avg ??
      cm?.average ??
      null;
  }

  if (card?.tcg) {
    const t = card.tcg;
    tcgplayerMarketPrice =
      tcgplayerMarketPrice ??
      t?.prices?.market ??
      t?.marketPrice ??
      t?.prices?.mid ??
      null;
  }

  if (card?.prices && typeof card.prices === 'object') {
    cardmarketAvg =
      cardmarketAvg ?? card.prices?.avg ?? card.prices?.average ?? null;
  }

  if (typeof card.marketPrice === 'number') {
    tcgplayerMarketPrice = tcgplayerMarketPrice ?? card.marketPrice;
  }

  const avg = cardmarketAvg ?? tcgplayerMarketPrice ?? null;

  return { cardmarketAvg, tcgplayerMarketPrice, avg };
}

/**
 * Normaliza una carta RAW de la API TCGdex para búsquedas y respuestas frontend
 * Crea una forma mínima y consistente que el frontend espera
 *
 * @param card - Objeto de carta RAW de la API
 * @returns Objeto normalizado con campos: id, name, images, set, rarity, types, pokemonTcgId
 *
 * @example
 * const normalized = normalizeSearchCard(rawCard);
 * // Returns: { id: 'swsh3-25', name: 'Pikachu', images: {...}, set: 'Sword & Shield', ... }
 */
export function normalizeSearchCard(card: any) {
  return {
    id: card.id || card._id || '',
    name: card.name || card.title || '',
    images: card.images || { small: card.imageUrl || card.image || '' },
    // include both set id/code and human name when possible
    setId:
      card.set?.id ||
      card.setId ||
      card.set?.code ||
      card.setCode ||
      (card.set && typeof card.set === 'string' ? card.set : ''),
    set:
      card.set?.name ||
      (typeof card.set === 'string' ? card.set : '') ||
      card.series ||
      '',
    rarity: card.rarity || card.rarityText || '',
    types: card.types || [],
    pokemonTcgId: card.id || card.pokemonTcgId || '',
  };
}
