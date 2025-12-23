import { useState } from 'react';
import { createItemStock } from '../../services/itemStock.service';

export const useCreateItemStock = (fetchData) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addStock = async (itemData) => {
    setLoading(true);
    setError(null);
    try {
      const [res, err] = await createItemStock(itemData);
      if (err) throw new Error(err);
      if (fetchData) fetchData(); 
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { addStock, loading, error };
};