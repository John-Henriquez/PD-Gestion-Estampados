import { useState, useEffect, useCallback } from 'react';
import { getPacks } from '../../services/pack.service';

const initialFilters = {
  isActive: true,
  searchTerm: '',
};

const usePack = () => {
  const [packs, setPacks] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPacks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPacks(filters);
      if (data) {
        setPacks(data);
      }
      setPacks(data);
    } catch (err) {
      console.error('Error fetching packs:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPacks();
  }, [fetchPacks]);

  return {
    packs,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchPacks,
  };
};

export default usePack;
