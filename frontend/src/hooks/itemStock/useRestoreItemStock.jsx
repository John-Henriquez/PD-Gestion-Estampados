import { useState, useCallback } from 'react';
import { restoreItemStock } from '../../services/itemStock.service';
import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';

export function useRestoreItemStock(onRefresh) {
  const [restoring, setRestoring] = useState(false);

  const restore = useCallback(
    async (id) => {
      setRestoring(true);
      try {
        await restoreItemStock(id);
        showSuccessAlert('Restaurado', 'El stock ha sido reactivado.');
        if (onRefresh) onRefresh();
      } catch (err) {
        showErrorAlert('Error al restaurar', err.message || err);
      }
      setRestoring(false);
    },
    [onRefresh]
  );

  return { restore, restoring };
}
