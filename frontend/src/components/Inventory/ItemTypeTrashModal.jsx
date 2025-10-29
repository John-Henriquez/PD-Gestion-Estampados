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
import { useEmptyTrash } from '../../hooks/itemType/useEmptyTrash.jsx';
import { useForceDeleteItemType } from '../../hooks/itemType/useForceDeleteItemType.jsx';
import '../../styles/components/trashModal.css';

const ItemTypeTrashModal = ({ open, onClose, trashedTypes, onRestore, onRefresh }) => {
  const { empty, loading: emptyingTrash } = useEmptyTrash();
  const { forceDelete, loading: deleting } = useForceDeleteItemType();

  const handleEmptyTrash = async () => {
    const result = await deleteDataAlert(
      '¿Vaciar la papelera?',
      'Esta acción eliminará permanentemente todos los elementos y no se podrá deshacer.'
    );

    if (result.isConfirmed) {
      try {
        await empty();
        showSuccessAlert(
          'Papelera vaciada',
          'Todos los elementos han sido eliminados permanentemente.'
        );
        onRefresh();
      } catch (err) {
        console.error('[handleEmptyTrash] Error:', err);
        showErrorAlert('Error al vaciar', 'Ocurrió un problema al vaciar la papelera.');
      }
    }
  };

  const handleForceDelete = async (id) => {
    const result = await deleteDataAlert(
      '¿Eliminar permanentemente este tipo?',
      'Esta acción no se puede deshacer.'
    );

    if (result.isConfirmed) {
      try {
        await forceDelete(id);
        showSuccessAlert('Eliminado', 'El tipo ha sido eliminado permanentemente.');
        onRefresh();
      } catch (err) {
        console.error(`[handleForceDelete] Error eliminando ID ${id}:`, err);
        showErrorAlert('Error al eliminar', 'Ocurrió un problema al eliminar el tipo.');
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
            Papelera de Tipos de Productos
          </Typography>
          <IconButton onClick={onClose} className="trash-modal__close-button">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent className="trash-modal__content">
        {trashedTypes.length === 0 ? (
          <Box className="trash-modal__empty-state">
            <Typography variant="h6" color="textSecondary" fontStyle="italic">
              La papelera está vacía 📭
            </Typography>
          </Box>
        ) : (
          <List className="trash-modal__list">
            {trashedTypes.map((type) => (
              <ListItem
                key={type.id}
                className="trash-modal__item"
                secondaryAction={
                  <Box className="trash-modal__actions">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleRestore(type.id)}
                      className="trash-modal__button trash-modal__button--restore"
                      startIcon={<RestoreFromTrashIcon />}
                    >
                      Restaurar
                    </Button>

                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleForceDelete(type.id)}
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
                  primary={type.name}
                  secondary={`Categoría: ${type.category} | Tallas: ${type.sizesAvailable?.join(', ') || 'N/A'}`}
                  className="trash-modal__item-text"
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions className="trash-modal__footer">
        {trashedTypes.length > 0 && (
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

export default ItemTypeTrashModal;
