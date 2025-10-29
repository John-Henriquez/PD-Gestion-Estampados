import { useState } from 'react';
import { addManualStock } from '../../services/itemStock.service';

export function useAddManualStock() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function addStock(id, quantity) {
    setLoading(true);
    setError(null);
    try {
      const updatedItem = await addManualStock(id, quantity);
      return updatedItem;
    } catch (err) {
      setError(err?.message || 'Error al añadir stock');
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { addStock, loading, error };
}
