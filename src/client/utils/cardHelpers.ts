/**
 * Utility functions for handling Pokémon TCG card images
 */

/**
 * Generates a TCGdex image URL from a card ID
 * @param pokemonTcgId - The card ID in format "setCode-number"
 * @param quality - Image quality: 'low', 'high' (default: 'high')
 * @returns TCGdex image URL or empty string if invalid ID
 * 
 * @example
 * ```typescript
 * const url = getTcgdexImageUrl('me01-178');
 * // Returns: https://assets.tcgdex.net/jp/me01/178/high.png
 * 
 * const url2 = getTcgdexImageUrl('swsh1-1', 'low');
 * // Returns: https://assets.tcgdex.net/en/swsh1/1/low.png
 * ```
 */
export function getTcgdexImageUrl(
  pokemonTcgId: string | null | undefined,
  quality: 'low' | 'high' = 'high'
): string {
  if (!pokemonTcgId) return '';

  const parts = pokemonTcgId.split('-');
  if (parts.length !== 2) return '';

  const [setCode, number] = parts;
  if (!setCode || !number) return '';

  // Detectar si es carta japonesa (me, sv, s, k, p, sm, xy) o inglesa
  const isJapanese = /^(me|sv|s|k|p|sm|xy)/i.test(setCode);
  const lang = isJapanese ? 'jp' : 'en';
  const cleanSetCode = setCode.toLowerCase();

  return `https://assets.tcgdex.net/${lang}/${cleanSetCode}/${number}/${quality}.png`;
}

/**
 * Gets the best available image URL for a card, with TCGdex fallback
 * @param images - Card images object with large/small properties
 * @param pokemonTcgId - Card ID for fallback generation
 * @param imageUrl - Alternative image URL
 * @returns Best available image URL
 * 
 * @example
 * ```typescript
 * const url = getCardImage(
 *   { large: 'https://...', small: 'https://...' },
 *   'me01-178',
 *   'https://fallback.com/image.png'
 * );
 * ```
 */
export function getCardImage(
  images?: { large?: string; small?: string } | null,
  pokemonTcgId?: string | null,
  imageUrl?: string | null
): string {
  // Try images object first
  if (images?.large) return images.large;
  if (images?.small) return images.small;

  // Try direct image URL
  if (imageUrl) return imageUrl;

  // Fallback to TCGdex generated URL
  return getTcgdexImageUrl(pokemonTcgId);
}

/**
 * Extracts set code and number from a Pokémon TCG ID
 * @param pokemonTcgId - The card ID in format "setCode-number"
 * @returns Object with setCode and number, or null if invalid
 * 
 * @example
 * ```typescript
 * const parts = parseCardId('me01-178');
 * // Returns: { setCode: 'me01', number: '178' }
 * 
 * const invalid = parseCardId('invalid');
 * // Returns: null
 * ```
 */
export function parseCardId(pokemonTcgId: string | null | undefined): {
  setCode: string;
  number: string;
} | null {
  if (!pokemonTcgId) return null;

  const parts = pokemonTcgId.split('-');
  if (parts.length !== 2) return null;

  const [setCode, number] = parts;
  if (!setCode || !number) return null;

  return { setCode, number };
}
