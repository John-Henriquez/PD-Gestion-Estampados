import { useState, useCallback } from 'react';
import { deleteItemType } from '../../services/itemType.service';

export const useDeleteItemType = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const removeType = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await deleteItemType(id);
      setLoading(false);
    } catch (err) {
      const errorMessage = err || 'Error al eliminar el tipo de ítem';
      setError(errorMessage);
      setLoading(false);
      throw errorMessage;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { removeType, loading, error, clearError };
};
