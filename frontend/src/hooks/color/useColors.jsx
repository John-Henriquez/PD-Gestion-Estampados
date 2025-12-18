import { useState, useEffect, useCallback } from 'react';
import { getColors } from '../../services/color.service.js';

export const useColors = () => {
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchColors = useCallback(async () => {
    setLoading(true);
    const [data, error] = await getColors();
    if (!error) setColors(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchColors();
  }, [fetchColors]);

  return { colors, loading, refetch: fetchColors };
};