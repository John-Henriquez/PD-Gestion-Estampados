import { useState, useContext } from 'react';
import { 
  Box, Button, Paper, Typography, Grid, Chip,
  CircularProgress, Alert, Tooltip, IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  DeleteSweep as DeleteSweepIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteIcon,
  Inventory as InventoryIcon,
  LocalOffer as TagIcon,
  CheckCircleOutline as CheckIcon
} from '@mui/icons-material';

import PackModal from './PackModal.jsx';
import PackTrashModal from './PackTrashModal.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';
import { deleteDataAlert, showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';

import usePack from '../../hooks/pack/usePack.jsx';
import useDeletePack from '../../hooks/pack/useDeletePack.jsx';
import useDeletedPacks from '../../hooks/pack/useDeletedPacks.jsx';
import useRestorePack from '../../hooks/pack/useRestorePack.jsx';

import '../../styles/components/packsSection.css';

const PacksSection = ({ itemStock, refetchStock }) => {
  const { user } = useContext(AuthContext);
  const [openPackModal, setOpenPackModal] = useState(false);
  const [openPackTrash, setOpenPackTrash] = useState(false);
  const [editingPack, setEditingPack] = useState(null);

  const { packs, loading: packsLoading, error: packsError, refetch: refetchPacks } = usePack();
  const { remove: deletePackHook, loading: deletingPack } = useDeletePack();
  const { deletedPacks, refetch: fetchDeletedPacks } = useDeletedPacks();
  const { restore: restorePackHook } = useRestorePack();

  const handleOpenPackModal = (packToEdit = null) => {
    setEditingPack(packToEdit);
    setOpenPackModal(true);
  };

  const handleOpenPackTrash = async () => {
    try {
      await fetchDeletedPacks();
      setOpenPackTrash(true);
    } catch (err) {
      showErrorAlert('Error', 'No se pudieron cargar los packs eliminados.');
      console.error('[PacksSection] Error fetching deleted packs:', err);
    }
  };

  const handleDelete = async (id) => {
    const result = await deleteDataAlert(
      '¿Desactivar este pack?',
      'Podrás restaurarlo desde la papelera.'
    );
    if (!result.isConfirmed) return;

    const [res, err] = await deletePackHook(id);
    if (res && res.status === 'Success') {
      showSuccessAlert('Desactivado', res.message || 'Pack enviado a la papelera');
      await refetchPacks();
    } else {
      const message = err?.message || 'Error al desactivar el pack.';
      showErrorAlert('Error', message);
      console.error('[PacksSection] Error deleting pack:', err);
    }
  };

  const handleRestore = async (id) => {
    try {
      await restorePackHook(id);
      showSuccessAlert('Restaurado', 'El pack fue restaurado correctamente');
      await Promise.all([refetchPacks(), fetchDeletedPacks()]);
      setOpenPackTrash(false);
    } catch (error) {
      showErrorAlert('Error al restaurar', error?.message || 'Ocurrió un error.');
    }
  };

  const handlePackModalCompleted = async () => {
    setOpenPackModal(false);
    setEditingPack(null);
    await refetchPacks();
    if (refetchStock) {
      await refetchStock();
    }
  };

return (
    <section className="packs-container">
      <header className="section-header">
        <Box className="title-area">
          <TagIcon color="primary" />
          <Typography variant="h5" fontWeight="700">
            Gestión de Packs
          </Typography>
          <Chip label={packs.length} size="small" />
        </Box>
        
        <Box className="actions-area">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenPackModal()}
          >
            Nuevo Pack
          </Button>

          <Tooltip title="Papelera">
            <IconButton onClick={handleOpenPackTrash}>
              <DeleteSweepIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </header>

      {packsLoading ? (
        <Box className="centered-loader"><CircularProgress /></Box>
      ) : packsError ? (
        <Alert severity="error">Error: {packsError.message || packsError}</Alert>
      ) : packs.length > 0 ? (
        <Grid container spacing={3} className="packs-grid">
          {packs.map((pack) => (
            <Grid item xs={12} sm={6} lg={4} key={pack.id}>
              <Paper className="pack-card" elevation={0}>
                <div className="pack-card-head">
                  <Typography variant="h6" className="pack-title">{pack.name}</Typography>
                </div>

                <div className="pack-card-body">
                  <div className="price-tag-area">
                    <Typography variant="h5" className="pack-price">
                      ${pack.price?.toLocaleString()}
                    </Typography>
                    {pack.discount > 0 && (
                      <Chip 
                        label={`${Math.round(pack.discount * 100)}% OFF`} 
                        size="small" 
                        className="discount-badge" 
                      />
                    )}
                  </div>
                  
                  <Typography variant="body2" className="pack-desc">
                    {pack.description || 'Sin descripción adicional.'}
                  </Typography>

                  <div className="items-preview-box">
                    <Typography variant="overline" className="items-label">Incluye:</Typography>
                    <ul className="items-list">
                      {pack.packItems?.map((pItem, idx) => (
                        <li
                          key={`${pack.id}-${pItem.itemStock?.id}-${pItem.itemStock?.size || 'nosize'}`}
                          className="item-row"
                        >
                          <CheckIcon className="check-icon" />
                          <span className="item-text">
                            <strong>{pItem.quantity}x</strong> {pItem.itemStock?.itemType?.name}
                            {pItem.itemStock?.size && <span className="size-label">({pItem.itemStock.size})</span>}
                          </span>
                          <div 
                            className="color-dot" 
                            style={{ 
                              backgroundColor: pItem.itemStock?.color?.hex || '#ccc' 
                            }} 
                            title={pItem.itemStock?.color?.name || 'Color base'}
                          />
                        </li>
                      ))}         
                    </ul>
                  </div>
                </div>

                <div className="pack-card-footer">
                  <Button 
                    variant="text" 
                    startIcon={<EditIcon />} 
                    size="small"
                    onClick={() => handleOpenPackModal(pack)}
                  >
                    Editar
                  </Button>
                  <Button 
                    variant="text" 
                    color="error" 
                    startIcon={<DeleteIcon />} 
                    size="small"
                    onClick={() => handleDelete(pack.id)}
                    disabled={deletingPack}
                  >
                    Desactivar
                  </Button>
                </div>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper className="empty-state">
          <Typography color="textSecondary">No hay packs configurados actualmente.</Typography>
        </Paper>
      )}
      {/* Modales de Pack */}
      <PackModal
        open={openPackModal}
        onClose={() => { setOpenPackModal(false); setEditingPack(null); }}
        onCompleted={handlePackModalCompleted}
        editingPack={editingPack}
        currentUserRut={user?.id || user?.rut}
        itemStock={itemStock}
        refetchStocks={refetchStock}
      />
      <PackTrashModal
        open={openPackTrash}
        onClose={() => setOpenPackTrash(false)}
        deletedPacks={deletedPacks || []}
        onRestore={handleRestore}
        onRefresh={async () => { await Promise.all([refetchPacks(), fetchDeletedPacks()]); }}
      />
    </section>
  );
};

export default PacksSection;
