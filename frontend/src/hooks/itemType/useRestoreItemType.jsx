import { useState, useCallback } from 'react';
import { restoreItemType } from '../../services/itemType.service';

export const useRestoreItemType = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const restoreType = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await restoreItemType(id);
      setLoading(false);
      return data;
    } catch (err) {
      const errorMessage = err || 'Error al restaurar el tipo de ítem';
      setError(errorMessage);
      setLoading(false);
      throw errorMessage;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { restoreType, loading, error, clearError };
};
