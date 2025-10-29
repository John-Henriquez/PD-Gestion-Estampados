import { useState, useCallback } from 'react';
import { getItemTypeById } from '../../services/itemType.service';

export const useGetItemType = () => {
  const [type, setType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTypeById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getItemTypeById(id);
      setType(data);
      setLoading(false);
      return data;
    } catch (err) {
      const errorMessage = err || 'Error al obtener el tipo de ítem';
      setError(errorMessage);
      setLoading(false);
      throw errorMessage;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { type, fetchTypeById, loading, error, clearError };
};
