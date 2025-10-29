import { useState } from 'react';
import { deletePack } from '../../services/pack.service';

const useDeletePack = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const remove = async (id) => {
    setLoading(true);
    setError(null);

    try {
      const [res, err] = await deletePack(id);
      if (err) setError(err);
      return [res, err];
    } catch (err) {
      setError(err);
      return [null, err];
    } finally {
      setLoading(false);
    }
  };

  return { remove, loading, error };
};

export default useDeletePack;
