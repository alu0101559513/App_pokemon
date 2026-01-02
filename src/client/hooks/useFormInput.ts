/**
 * @file useFormInput.ts
 * @description Hook personalizado para manejo de inputs de formularios
 * 
 * Proporciona:
 * - Estado del formulario
 * - Función handleChange genérica
 * - Reset del formulario
 * 
 * @module hooks/useFormInput
 */

import { useState, ChangeEvent } from 'react';

/**
 * Hook personalizado para manejar inputs de formularios
 * 
 * @template T - Tipo del objeto de formulario
 * @param {T} initialValues - Valores iniciales del formulario
 * @returns {object} Objeto con values, handleChange, reset, y setValue
 * 
 * @example
 * const { values, handleChange, reset } = useFormInput({
 *   username: '',
 *   password: ''
 * });
 * 
 * <input
 *   name="username"
 *   value={values.username}
 *   onChange={handleChange}
 * />
 */
export function useFormInput<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Manejo especial para checkboxes
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setValues((prev) => ({ ...prev, [name]: checked }));
    } else {
      setValues((prev) => ({ ...prev, [name]: value }));
    }
  };

  const reset = () => setValues(initialValues);

  const setValue = (name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const setAllValues = (newValues: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...newValues }));
  };

  return {
    values,
    handleChange,
    reset,
    setValue,
    setAllValues,
  };
}
