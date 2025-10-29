import { useState } from 'react';
import { forceDeleteItemStock } from '../../services/itemStock.service';

export function useForceDeleteItemStock() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const forceDelete = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await forceDeleteItemStock(id);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err);
      setLoading(false);
      throw err;
    }
  };

  return { forceDelete, loading, error };
}
