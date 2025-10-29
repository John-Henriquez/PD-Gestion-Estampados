import { useState, useCallback } from 'react';
import { forceDeleteItemType } from '../../services/itemType.service';

export const useForceDeleteItemType = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const forceDelete = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await forceDeleteItemType(id);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { forceDelete, loading, error, clearError };
};
