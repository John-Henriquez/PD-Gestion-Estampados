import { useState } from 'react';
// Cambiamos la forma de importar para agrupar todas las funciones en un objeto
import * as itemStockService from '../../services/itemStock.service.js';

export const useRestockStock = () => {
  const [loading, setLoading] = useState(false);

  const restock = async (restockData) => {
    setLoading(true);
    try {
      const [res, err] = await itemStockService.restockVariants(restockData);
      if (err) throw new Error(err);
      return [res, null];
    } catch (error) {
      return [null, error.message];
    } finally {
      setLoading(false);
    }
  };

  return { restock, loading };
};