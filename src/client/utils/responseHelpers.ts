/**
 * Utility functions for handling HTTP responses
 */

/**
 * Safely parses JSON from a Response, returning an empty object on failure
 * @param response - The Response object to parse
 * @returns Parsed JSON data or empty object
 * 
 * @example
 * ```typescript
 * const data = await safeJsonParse(response);
 * if (!response.ok) {
 *   throw new Error(data.error || 'Request failed');
 * }
 * ```
 */
export async function safeJsonParse<T = any>(response: Response): Promise<T> {
  try {
    return await response.json();
  } catch {
    return {} as T;
  }
}

/**
 * Checks if a response is OK and throws an error if not
 * @param response - The Response object to check
 * @param errorMessage - Default error message if response has no error property
 * @throws Error with message from response data or default message
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/data');
 * await checkResponse(response, 'Failed to load data');
 * const data = await response.json();
 * ```
 */
export async function checkResponse(
  response: Response,
  errorMessage: string = 'Request failed'
): Promise<void> {
  if (!response.ok) {
    const data = await safeJsonParse<{ error?: string }>(response);
    throw new Error(data.error || errorMessage);
  }
}

/**
 * Fetches and parses JSON, handling errors gracefully
 * @param response - The Response object
 * @param errorMessage - Default error message
 * @returns Parsed JSON data
 * @throws Error if response is not OK
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/data');
 * const data = await fetchJson(response, 'Failed to load data');
 * ```
 */
export async function fetchJson<T = any>(
  response: Response,
  errorMessage: string = 'Request failed'
): Promise<T> {
  await checkResponse(response, errorMessage);
  return await response.json();
}
