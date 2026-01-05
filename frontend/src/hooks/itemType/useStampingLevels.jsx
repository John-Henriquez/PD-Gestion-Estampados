import { useState, useEffect } from 'react';
import { getGlobalStampingLevels } from '../../services/itemType.service';

export const useStampingLevels = () => {
  const [globalLevels, setGlobalLevels] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLevels = async () => {
    setLoading(true);
    try {
      const data = await getGlobalStampingLevels();
      setGlobalLevels(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  return { globalLevels, loading, refreshLevels: fetchLevels };
};