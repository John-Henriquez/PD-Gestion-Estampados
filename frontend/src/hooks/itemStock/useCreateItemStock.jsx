import { useState } from 'react';
import { createItemStock } from '../../services/itemStock.service';

export const useCreateItemStock = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addStock = async (itemData) => {
    setLoading(true);
    setError(null);
    try {
      const createdItem = await createItemStock(itemData);
      return createdItem;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { addStock, loading, error };
};
