/**
 * @file imageHelpers.ts
 * @description Utilidades para manejo y normalización de URLs de imágenes de cartas
 * Centraliza la lógica de corrección de URLs malformadas de TCGdex
 */

/**
 * Normaliza y corrige URLs de imágenes de cartas TCGdex
 * 
 * Corrige URLs malformadas que vienen de la API de TCGdex:
 * - Inserta el componente de serie faltante (swsh, sm, xy, etc.)
 * - Fuerza idioma inglés (en)
 * - Convierte calidad a high
 * 
 * @example
 * // URL malformada
 * normalizeImageUrl('https://assets.tcgdex.net/jp/swsh5/123/low.png')
 * // Retorna: 'https://assets.tcgdex.net/en/swsh/swsh5/123/high.png'
 * 
 * @param url - URL de imagen a normalizar
 * @returns URL normalizada o string vacío si no hay URL
 */
export function normalizeImageUrl(url?: string): string {
  if (!url) return '';
  let s = String(url);

  // Detectar URLs de TCGdex
  const tcgdexUrlPattern = /^(https?:\/\/assets\.tcgdex\.net\/)(.+)$/i;
  const tcgdexMatch = s.match(tcgdexUrlPattern);
  
  if (tcgdexMatch) {
    const [, baseUrl, path] = tcgdexMatch;
    
    // Intentar detectar formato con 3 segmentos: lang/serie/setCode/resto
    const threeSegmentPattern = /^(?:jp|en)\/([a-z]+)\/([a-z]+\d+)\/(.+)$/i;
    const threeSegmentMatch = path.match(threeSegmentPattern);
    
    if (threeSegmentMatch) {
      // Ya tiene formato de 3 segmentos - verificar si la serie es correcta
      const [, currentSeries, setCode, rest] = threeSegmentMatch;
      const correctSeries = setCode.match(/^([a-z]+)/i)?.[1].toLowerCase();
      
      if (correctSeries && currentSeries.toLowerCase() !== correctSeries) {
        // Serie incorrecta - corregir (ej: ba/base1 → base/base1)
        s = `${baseUrl}en/${correctSeries}/${setCode.toLowerCase()}/${rest}`;
      } else {
        // Serie correcta - solo asegurar idioma inglés
        s = s.replace(/^(https?:\/\/assets\.tcgdex\.net\/)jp\//i, '$1en/');
      }
    } else {
      // Formato de 2 segmentos: lang/setCode/resto (falta la serie)
      const twoSegmentPattern = /^(?:jp|en)\/([a-z]+\d+)\/(.+)$/i;
      const twoSegmentMatch = path.match(twoSegmentPattern);
      
      if (twoSegmentMatch) {
        const [, setCode, rest] = twoSegmentMatch;
        const series = setCode.match(/^([a-z]+)/i)?.[1].toLowerCase();
        
        if (series) {
          s = `${baseUrl}en/${series}/${setCode.toLowerCase()}/${rest}`;
        }
      }
    }
  }

  // Normalizar calidad a high
  if (/\/(?:small|large|high|low)\.png$/i.test(s)) {
    return s.replace(/\/(?:small|large|high|low)\.png$/i, '/high.png');
  }
  
  // Si ya tiene extensión, retornar como está
  if (/\.(png|jpg|jpeg|gif|webp)$/i.test(s)) return s;
  
  // Si no tiene extensión, agregar /high.png
  return s.endsWith('/') ? `${s}high.png` : `${s}/high.png`;
}
