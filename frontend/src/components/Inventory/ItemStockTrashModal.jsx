import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, IconButton, Divider
} from '@mui/material';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import CloseIcon from '@mui/icons-material/Close';
import InventoryIcon from '@mui/icons-material/Inventory';

import { showSuccessAlert, showErrorAlert, deleteDataAlert } from '../../helpers/sweetAlert';
import { useEmptyDeletedItemStock } from '../../hooks/itemStock/useEmptyDeletedItemStock.jsx';
import { useRestoreItemStock } from '../../hooks/itemStock/useRestoreItemStock.jsx';
import { useForceDeleteItemStock } from '../../hooks/itemStock/useForceDeleteItemStock.jsx';
import '../../styles/components/trashModal.css';

const ItemStockTrashModal = ({ open, onClose, trashedItems, onRefresh }) => {
  const { emptyTrash, loading: emptyingTrash } = useEmptyDeletedItemStock();
  const { restore, loading: restoring } = useRestoreItemStock();
  const { forceDelete, loading: deleting } = useForceDeleteItemStock();
  const [forceDeletingId, setForceDeletingId] = useState(null);

  const handleEmptyTrash = async () => {
    const result = await deleteDataAlert(
      '¿Vaciar la papelera?',
      'Esta acción eliminará permanentemente todos los elementos y no se podrá deshacer.'
    );
    if (!result.isConfirmed) return;

    try {
      await emptyTrash();
      showSuccessAlert(
        'Papelera vaciada',
        'Todos los elementos han sido eliminados permanentemente.'
      );
      onRefresh();
      onClose();
    } catch (err) {
      console.error('[handleEmptyTrash] Error:', err);

      const errorMessage =
        typeof err === 'object' && err?.message
          ? err.message
          : 'Ocurrió un problema al vaciar la papelera.';

      showErrorAlert('Error al vaciar', errorMessage);
    }
  };

  const getColorNameFromHex = (hex) => {
    if (!hex) return '';
    const color = COLOR_DICTIONARY.find((c) => c.hex.toUpperCase() === hex.toUpperCase());
    return color ? color.name : hex;
  };

  const handleRestore = async (id) => {
    try {
      await restore(id);
      showSuccessAlert('Restaurado', 'El stock ha sido restaurado.');

      onRefresh();
      onClose();
    } catch (err) {
      console.error('[handleRestore] Error:', err);
      showErrorAlert('Error al restaurar', 'Ocurrió un problema al restaurar el stock.');
    }
  };

  const handleForceDelete = async (id) => {
    const result = await deleteDataAlert(
      '¿Eliminar permanentemente este stock?',
      'Esta acción no se puede deshacer.'
    );
    if (!result.isConfirmed) return;

    try {
      setForceDeletingId(id);
      await forceDelete(id);
      showSuccessAlert('Eliminado', 'El stock ha sido eliminado permanentemente.');
      onRefresh();
    } catch (err) {
      console.error(`[handleForceDelete] Error eliminando ID ${id}:`, err);
      if (err?.message?.includes('utilizado en uno o más paquetes')) {
        showErrorAlert(
          'No se puede eliminar',
          'Este stock está siendo utilizado en uno o más paquetes. Elimínalo de esos paquetes antes de continuar.'
        );
      } else {
        showErrorAlert('Error al eliminar', 'Ocurrió un problema al eliminar el stock.');
      }
    } finally {
      setForceDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" className="trash-dialog">
      <DialogTitle className="trash-header">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <DeleteSweepIcon color="error" />
          <Typography variant="h6" fontWeight="800">Papelera de Stock</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers className="trash-modal-container" sx={{ p: 0 }}>
        <Box className="trash-scroll-area">
          {(!trashedItems || trashedItems.length === 0) ? (
            <Box className="trash-empty-state">
              <InventoryIcon sx={{ fontSize: 64, mb: 2, opacity: 0.1 }} />
              <Typography variant="h6" color="textSecondary">Papelera vacía</Typography>
            </Box>
          ) : (
            trashedItems.map((item) => (
              <Box key={item.id} className="trash-item-row">
                <Box className="trash-item-info">
                  <Box 
                    sx={{ 
                      width: 14, height: 14, borderRadius: '50%', 
                      bgcolor: item.color?.hex || item.hexColor || '#ccc',
                      border: '1px solid rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Box>
                    <Typography className="trash-item-name">
                      {item.itemType?.name || 'Producto'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Talla: {item.size || 'N/A'} • Cant: {item.quantity}
                    </Typography>
                  </Box>
                </Box>
                <Box className="trash-item-actions">
                  <Button 
                    variant="text" 
                    startIcon={<RestoreFromTrashIcon />}
                    onClick={() => handleRestore(item.id)}
                    disabled={restoring && processingId === item.id}
                  >
                    Restaurar
                  </Button>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </DialogContent>

      <DialogActions className="trash-modal-footer">
        <Typography variant="caption">
          {trashedItems?.length || 0} elementos
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {trashedItems?.length > 0 && (
            <Button color="error" onClick={async () => {
              const res = await deleteDataAlert('¿Vaciar papelera?', 'Esto es irreversible.');
              if(res.isConfirmed) { await emptyTrash(); onRefresh(); onClose(); }
            }}>
              Vaciar
            </Button>
          )}
          <Button onClick={onClose}>Cerrar</Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ItemStockTrashModal;
