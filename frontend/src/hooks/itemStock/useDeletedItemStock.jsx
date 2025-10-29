import { useState, useCallback } from 'react';
import { getDeletedItemStock } from '../../services/itemStock.service';

export function useDeletedItemStock() {
  const [deletedStock, setDeletedStock] = useState([]);
  const [loadingDeletedStock, setLoadingDeletedStock] = useState(false);
  const [error, setError] = useState(null);

  const fetchDeletedStock = useCallback(async () => {
    setLoadingDeletedStock(true);
    setError(null);
    try {
      const response = await getDeletedItemStock();
      if (response.error) throw new Error(response.error);
      setDeletedStock(response.data || response);
    } catch (error) {
      console.error('Error al cargar stock eliminado:', error);
      setError(error.message || 'Error al cargar stock eliminado');
    } finally {
      setLoadingDeletedStock(false);
    }
  }, []);

  return { deletedStock, loadingDeletedStock, error, fetchDeletedStock };
}
