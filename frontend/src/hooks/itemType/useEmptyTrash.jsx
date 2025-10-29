import { useState, useCallback } from 'react';
import { emptyTrash } from '../../services/itemType.service';

export const useEmptyTrash = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const empty = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await emptyTrash();
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { empty, loading, error, clearError };
};
