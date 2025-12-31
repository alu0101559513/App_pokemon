/**
 * @file fetchHelpers.ts
 * @description Funciones auxiliares para realizar peticiones HTTP con autenticación
 *
 * Proporciona helpers para:
 * - Fetch con headers de autenticación automáticos
 * - Manejo de errores HTTP
 * - Construcción de headers comunes
 *
 * @module utils/fetchHelpers
 */

import { API_BASE_URL } from '../config/constants';

/**
 * Opciones extendidas para las peticiones fetch autenticadas
 */
export interface AuthFetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
}

/**
 * Obtiene el token JWT del localStorage
 * @returns {string} Token JWT o cadena vacía si no existe
 */
export function getAuthToken(): string {
  return localStorage.getItem('token') || '';
}

/**
 * Construye headers con autenticación y Content-Type JSON
 * @param {Record<string, string>} [additionalHeaders] - Headers adicionales opcionales
 * @returns {HeadersInit} Headers configurados con Authorization y Content-Type
 */
export function getAuthHeaders(
  additionalHeaders?: Record<string, string>
): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...additionalHeaders,
  };
}

/**
 * Realiza una petición fetch con autenticación automática
 * @async
 * @param {string} url - URL completa o path relativo (se concatenará con API_BASE_URL)
 * @param {AuthFetchOptions} [options] - Opciones de fetch
 * @returns {Promise<Response>} Respuesta HTTP
 * @throws {Error} Si la petición falla o el servidor retorna error
 *
 * @example
 * // Con URL completa
 * const res = await authenticatedFetch('http://localhost:3000/users/me');
 *
 * @example
 * // Con path relativo
 * const res = await authenticatedFetch('/users/me');
 *
 * @example
 * // POST con body
 * const res = await authenticatedFetch('/trades', {
 *   method: 'POST',
 *   body: JSON.stringify({ cardId: '123' })
 * });
 */
export async function authenticatedFetch(
  url: string,
  options: AuthFetchOptions = {}
): Promise<Response> {
  // Si la URL no es completa (no empieza con http), añadir API_BASE_URL
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  const { headers: customHeaders, ...restOptions } = options;

  const response = await fetch(fullUrl, {
    ...restOptions,
    headers: getAuthHeaders(customHeaders),
  });

  return response;
}

/**
 * Realiza un GET con autenticación y retorna JSON parseado
 * @async
 * @template T - Tipo del dato retornado
 * @param {string} url - URL de la petición
 * @returns {Promise<T>} Datos parseados
 * @throws {Error} Si la petición falla
 */
export async function authenticatedGet<T = any>(url: string): Promise<T> {
  const response = await authenticatedFetch(url, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * Realiza un POST con autenticación y retorna JSON parseado
 * @async
 * @template T - Tipo del dato retornado
 * @param {string} url - URL de la petición
 * @param {any} data - Datos a enviar en el body
 * @returns {Promise<T>} Datos parseados de la respuesta
 * @throws {Error} Si la petición falla
 */
export async function authenticatedPost<T = any>(
  url: string,
  data: any
): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * Realiza un PUT con autenticación y retorna JSON parseado
 * @async
 * @template T - Tipo del dato retornado
 * @param {string} url - URL de la petición
 * @param {any} data - Datos a enviar en el body
 * @returns {Promise<T>} Datos parseados de la respuesta
 * @throws {Error} Si la petición falla
 */
export async function authenticatedPut<T = any>(
  url: string,
  data: any
): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * Realiza un DELETE con autenticación y retorna JSON parseado
 * @async
 * @template T - Tipo del dato retornado
 * @param {string} url - URL de la petición
 * @returns {Promise<T>} Datos parseados de la respuesta
 * @throws {Error} Si la petición falla
 */
export async function authenticatedDelete<T = any>(url: string): Promise<T> {
  const response = await authenticatedFetch(url, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}
