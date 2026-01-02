/**
 * @file useLoadingError.ts
 * @description Hook personalizado para manejo de estados de carga y error
 * 
 * Proporciona:
 * - Estado de carga (loading)
 * - Estado de error con mensaje
 * - Funciones para actualizar ambos estados
 * 
 * @module hooks/useLoadingError
 */

import { useState } from 'react';

interface UseLoadingErrorReturn {
  loading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  startLoading: () => void;
  stopLoading: () => void;
  handleError: (error: unknown) => void;
}

/**
 * Hook personalizado para manejar estados de loading y error
 * 
 * @param {boolean} initialLoading - Estado inicial de carga (default: false)
 * @returns {UseLoadingErrorReturn} Objeto con estados y funciones
 * 
 * @example
 * const { loading, error, startLoading, stopLoading, handleError } = useLoadingError();
 * 
 * async function fetchData() {
 *   startLoading();
 *   try {
 *     const data = await api.getData();
 *     return data;
 *   } catch (err) {
 *     handleError(err);
 *   } finally {
 *     stopLoading();
 *   }
 * }
 */
export function useLoadingError(initialLoading = false): UseLoadingErrorReturn {
  const [loading, setLoading] = useState<boolean>(initialLoading);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);
  const startLoading = () => {
    setLoading(true);
    setError(null);
  };
  const stopLoading = () => setLoading(false);

  const handleError = (err: unknown) => {
    if (err instanceof Error) {
      setError(err.message);
    } else if (typeof err === 'string') {
      setError(err);
    } else {
      setError('Error desconocido');
    }
  };

  return {
    loading,
    error,
    setLoading,
    setError,
    clearError,
    startLoading,
    stopLoading,
    handleError,
  };
}
