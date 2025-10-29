import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Button,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CloseIcon from '@mui/icons-material/Close';

import { deleteDataAlert, showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';
import useEmptyDeletedPacks from '../../hooks/pack/useEmptyDeletedPacks.jsx';
import useForceDeletePack from '../../hooks/pack/useForceDeletePack.jsx';
import '../../styles/components/trashModal.css';

const PackTrashModal = ({ open, onClose, deletedPacks, onRestore, onRefresh }) => {
  const { emptyTrash, loading: emptyingTrash } = useEmptyDeletedPacks();
  const { forceDelete, loading: deleting } = useForceDeletePack();

  const handleEmptyTrash = async () => {
    const result = await deleteDataAlert(
      '¿Vaciar la papelera de Packs?',
      'Esta acción eliminará permanentemente todos los packs y no se podrá deshacer.'
    );

    if (result.isConfirmed) {
      try {
        await emptyTrash();
        showSuccessAlert(
          'Papelera vaciada',
          'Todos los packs han sido eliminados permanentemente.'
        );
        if (onRefresh) {
          await onRefresh();
        }
      } catch (err) {
        console.error('[handleEmptyTrash] Error:', err);
        showErrorAlert('Error al vaciar', 'Ocurrió un problema al vaciar la papelera.');
      }
    }
  };

  const handleForceDelete = async (id) => {
    const result = await deleteDataAlert(
      '¿Eliminar permanentemente este pack?',
      'Esta acción no se puede deshacer.'
    );

    if (result.isConfirmed) {
      try {
        await forceDelete(id);
        showSuccessAlert('Eliminado', 'El pack ha sido eliminado permanentemente.');
        onRefresh();
      } catch (err) {
        console.error(`[handleForceDelete] Error eliminando ID ${id}:`, err);
        showErrorAlert('Error al eliminar', 'Ocurrió un problema al eliminar el pack.');
      }
    }
  };

  const handleRestore = (id) => {
    onRestore(id);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" className="trash-modal">
      <DialogTitle className="trash-modal__header">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" className="trash-modal__title">
            Papelera de Packs
          </Typography>
          <IconButton onClick={onClose} className="trash-modal__close-button">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent className="trash-modal__content">
        {deletedPacks.length === 0 ? (
          <Box className="trash-modal__empty-state">
            <Typography variant="h6" color="textSecondary" fontStyle="italic">
              La papelera está vacía 📭
            </Typography>
          </Box>
        ) : (
          <List className="trash-modal__list">
            {deletedPacks.map((pack) => (
              <ListItem
                key={pack.id}
                className="trash-modal__item"
                secondaryAction={
                  <Box className="trash-modal__actions">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleRestore(pack.id)}
                      className="trash-modal__button trash-modal__button--restore"
                      startIcon={<RestoreFromTrashIcon />}
                    >
                      Restaurar
                    </Button>

                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleForceDelete(pack.id)}
                      disabled={deleting}
                      className="trash-modal__button trash-modal__button--delete"
                      startIcon={<DeleteForeverIcon />}
                    >
                      Eliminar permanentemente
                    </Button>
                  </Box>
                }
              >
                <ListItemText
                  primary={pack.name}
                  secondary={`Precio: $${pack.price} | Descuento: ${Math.round((pack.discount || 0) * 100)}%`}
                  className="trash-modal__item-text"
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions className="trash-modal__footer">
        {deletedPacks.length > 0 && (
          <Button
            onClick={handleEmptyTrash}
            disabled={emptyingTrash}
            className="trash-modal__button trash-modal__button--empty"
            startIcon={<DeleteSweepIcon />}
          >
            Vaciar Papelera
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PackTrashModal;
