import React, { useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import {
  Add as AddIcon,
  DeleteOutline as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
} from '@mui/icons-material';

import AddItemTypeModal from './AddItemTypeModal.jsx';
import ItemTypeTrashModal from './ItemTypeTrashModal.jsx';
import { iconMap } from '../../data/iconCategories';
import { deleteDataAlert, showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';

import { useDeleteItemType } from '../../hooks/itemType/useDeleteItemType.jsx';
import { useDeletedItemTypes } from '../../hooks/itemType/useDeletedItemType.jsx';
import { useRestoreItemType } from '../../hooks/itemType/useRestoreItemType.jsx';
import '../../styles/components/itemTypesSection.css';

const ItemTypesSection = ({ itemTypes = [], fetchTypes, refetchStock }) => {
  const [openAddTypeModal, setOpenAddTypeModal] = useState(false);
  const [openTrashModal, setOpenTrashModal] = useState(false);
  const [editingType, setEditingType] = useState(null);

  const { removeType } = useDeleteItemType();
  const { deletedTypes, fetchDeletedTypes } = useDeletedItemTypes();
  const { restoreType } = useRestoreItemType();

  const handleOpenAddModal = (typeToEdit = null) => {
    setEditingType(typeToEdit);
    setOpenAddTypeModal(true);
  };

  const handleOpenTrash = async () => {
    try {
      await fetchDeletedTypes();
      setOpenTrashModal(true);
    } catch (err) {
      showErrorAlert('Error', 'No se pudieron cargar los tipos eliminados.');
      console.error('[ItemTypesSection] Error fetching deleted types:', err);
    }
  };

  const handleDelete = async (id) => {
    const result = await deleteDataAlert(
      '¿Desactivar este tipo?',
      'Podrás restaurarlo desde la papelera.'
    );
    if (result.isConfirmed) {
      try {
        await removeType(id);
        showSuccessAlert('Desactivado', 'El tipo de ítem fue enviado a la papelera.');
        await Promise.all([fetchTypes(), refetchStock ? refetchStock() : Promise.resolve()]);
      } catch (error) {
        console.error(error);
        showErrorAlert('Error al desactivar', error?.message || 'Ocurrió un error.');
      }
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreType(id);
      showSuccessAlert('Restaurado', 'El tipo de ítem fue restaurado.');
      await Promise.all([
        fetchTypes(),
        fetchDeletedTypes(),
        refetchStock ? refetchStock() : Promise.resolve(),
      ]);
    } catch (error) {
      showErrorAlert('Error al restaurar', error?.message || 'Ocurrió un error.');
    }
  };

  const handleCreatedOrUpdated = async () => {
    await Promise.all([
      fetchTypes(),
      refetchStock ? refetchStock() : Promise.resolve()
    ]);

    setOpenAddTypeModal(false);
    setEditingType(null);
  };

  return (
    <Paper className="inventory-paper">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="h5">Tipos de productos ({itemTypes.length})</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            className="inventory-button inventory-button--contained"
            onClick={() => handleOpenAddModal()}
          >
            Nuevo Tipo
          </Button>
          <Button
            variant="outlined"
            startIcon={<DeleteSweepIcon />}
            className="inventory-button inventory-button--outlined"
            onClick={handleOpenTrash}
          >
            Papelera
          </Button>
        </Box>
      </Box>

      {itemTypes.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {itemTypes.map((type) => (
            <Paper key={type.id} variant="outlined" className="item-type-item">
              <Box className="item-type-info">
                {type.iconName && iconMap[type.iconName] && React.createElement(iconMap[type.iconName], { size: 22 })}
                <Box sx={{ ml: 1 }}>
                  <Typography component="strong" className="item-type-name" sx={{ display: 'block' }}>
                    {type.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {type.hasSizes && (
                      <Typography variant="caption" color="text.secondary">
                        Tallas: {type.sizesAvailable?.join(', ')}
                      </Typography>
                    )}
                    {type.stocks?.length > 0 && (
                      <Chip 
                        label={`${type.stocks.length} variaciones`} 
                        size="small" 
                        sx={{ height: 16, fontSize: '0.65rem', bgcolor: 'var(--primary-light)' }} 
                      />
                    )}
                  </Box>
                </Box>
              </Box>
              <Box className="item-type-actions">
                <Button size="small" variant="text" onClick={() => handleOpenAddModal(type)}>
                  Editar
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleDelete(type.id)}
                  color="error"
                  startIcon={<DeleteIcon fontSize="small" />}
                  className="inventory-button inventory-button--error inventory-button--small"
                >
                  Desactivar
                </Button>
              </Box>
            </Paper>
          ))}
        </Box>
      ) : (
        <Typography sx={{ textAlign: 'center', p: 2, color: 'text.secondary' }}>
          No hay tipos de producto definidos.
        </Typography>
      )}

      <AddItemTypeModal
        open={openAddTypeModal}
        onClose={() => {
          setOpenAddTypeModal(false);
          setEditingType(null);
        }}
        onCreated={handleCreatedOrUpdated}
        editingType={editingType}
      />
      <ItemTypeTrashModal
        open={openTrashModal}
        onClose={() => setOpenTrashModal(false)}
        trashedTypes={deletedTypes}
        onRestore={handleRestore}
        onRefresh={async () => {
          await fetchTypes();
          await fetchDeletedTypes();
        }}
      />
    </Paper>
  );
};

export default ItemTypesSection;
