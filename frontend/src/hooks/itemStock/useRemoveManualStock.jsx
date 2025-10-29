import { useState } from 'react';
import { removeManualStock } from '../../services/itemStock.service';

export function useRemoveManualStock() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function removeStock(id, quantity) {
    setLoading(true);
    setError(null);
    try {
      const updatedItem = await removeManualStock(id, quantity);
      return updatedItem;
    } catch (err) {
      setError(err?.message || 'Error al reducir stock');
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { removeStock, loading, error };
}
