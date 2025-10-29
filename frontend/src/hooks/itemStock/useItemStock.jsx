import { useState, useEffect, useCallback } from 'react';
import { getItemStock } from '../../services/itemStock.service';
import { getItemTypes } from '../../services/itemType.service';

const initialFilters = {
  color: '',
  size: '',
  typeId: '',
  searchTerm: '',
  stockStatus: '',
};

const useItemStock = () => {
  const [itemTypes, setItemTypes] = useState([]);
  const [itemStock, setItemStock] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInventoryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [types, stock] = await Promise.all([getItemTypes(), getItemStock(filters)]);
      setItemTypes(types);
      setItemStock(stock);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  return {
    itemTypes,
    itemStock,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchInventoryData,
  };
};

export default useItemStock;
