import { useState, useCallback } from 'react';
import { getDeletedItemTypes } from '../../services/itemType.service';

export const useDeletedItemTypes = () => {
  const [deletedTypes, setDeletedTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDeletedTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDeletedItemTypes();
      setDeletedTypes(data);
      setLoading(false);
    } catch (err) {
      console.error('[useDeletedItemTypes] Error al obtener datos:', err);
      setError(err);
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { deletedTypes, loading, error, fetchDeletedTypes, clearError };
};
