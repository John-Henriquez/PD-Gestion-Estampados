import { useState, useCallback } from 'react';
import { updateItemType } from '../../services/itemType.service';

export const useUpdateItemType = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateType = useCallback(async (id, formData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await updateItemType(id, formData);
      setLoading(false);
      return data;
    } catch (err) {
      const errorMessage = err || 'Error al actualizar el tipo de ítem';
      setError(errorMessage);
      setLoading(false);
      throw errorMessage;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { updateType, loading, error, clearError };
};
