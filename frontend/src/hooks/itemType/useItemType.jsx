import { useState, useCallback } from 'react';
import { getItemTypes, createItemType } from '../../services/itemType.service';

export const useItemTypes = () => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getItemTypes();
      setTypes(data);
      setLoading(false);
    } catch (err) {
      setError(err || 'Error al obtener los tipos de ítems');
      setLoading(false);
    }
  }, []);

  const addType = useCallback(async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await createItemType(formData);
      setTypes((prev) => [...prev, data]);
      setLoading(false);
      return data;
    } catch (err) {
      const errorMessage = err || 'Error al crear el tipo de ítem';
      setError(errorMessage);
      setLoading(false);
      throw errorMessage;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { types, fetchTypes, addType, loading, error, clearError };
};
