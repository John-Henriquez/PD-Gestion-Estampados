import { useState, useEffect, useCallback, useMemo } from 'react';
import { getInventoryMovements } from '../../services/inventoryMovement.service';

const initialFilters = {
  startDate: '',
  endDate: '',
  type: '',
  itemStockId: '',
  createdBy: '',
};

const useInventoryMovements = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getInventoryMovements(filters);
      setMovements(data.movements || []);
    } catch (err) {
      console.error('Error in useInventoryMovements:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const totals = useMemo(() => {
    return movements.reduce((acc, mov) => {
      if (mov.type === 'entrada') acc.entrada += 1;
      if (mov.type === 'salida') acc.salida += 1;
      return acc;
    }, { entrada: 0, salida: 0 });
  }, [movements]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  return {
    movements,
    totals,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchMovements,
  };
};

export default useInventoryMovements;
