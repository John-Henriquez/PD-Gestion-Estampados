import React, { useState } from 'react';
import { 
  Box, Button, Paper, Typography, Chip,
  IconButton, Tooltip, Grid
} from '@mui/material';
import {
  Add as AddIcon,
  DeleteOutline as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
  Edit as EditIcon,
  Category as CategoryIcon
} from '@mui/icons-material';

import AddItemTypeModal from './AddItemTypeModal.jsx';
import ItemTypeTrashModal from './ItemTypeTrashModal.jsx';

import { iconMap } from '../../data/iconCategories';
import { 
  deleteDataAlert,
  showSuccessAlert,
  showErrorAlert
} from '../../helpers/sweetAlert';

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
    <section className="item-types-container">
      <header className="item-types-header">
        <Box className="title-area">
          <CategoryIcon color="primary" />
          <Typography variant="h5" fontWeight="700">
            Tipos de productos
          </Typography>
          <Chip label={itemTypes.length} size="small" />
        </Box>

        <Box className="actions-area">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenAddModal()}
          >
            Nuevo Tipo
          </Button>

          <Tooltip title="Papelera">
            <IconButton onClick={async () => {
              await fetchDeletedTypes();
              setOpenTrashModal(true);
            }}>
              <DeleteSweepIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </header>

      {itemTypes.length > 0 ? (
        <div className="types-grid">
          {itemTypes.map((type, index) => (
            <Paper className="type-card" elevation={0} key={index}>
              <div className="type-main">
                <div className="icon-wrapper">
                  {type.iconName && iconMap[type.iconName]
                    ? React.createElement(iconMap[type.iconName], { size: 26 })
                    : <CategoryIcon />}
                </div>

                <div className="type-info">
                  <Typography className="type-name">
                    {type.name}
                  </Typography>

                  <div className="badges">
                    <Chip
                      size="small"
                      variant="outlined"
                      label={type.hasSizes ? 'Con tallas' : 'Talla única'}
                    />
                    {type.stocks?.length > 0 && (
                      <Chip size="small" label={`${type.stocks.length} SKU`} />
                    )}
                  
                  </div>
                </div>
              </div>

              <div className="type-actions">
                <Button 
                  size="small" 
                  startIcon={<EditIcon />} 
                  onClick={() => {
                    setEditingType(type);
                    setOpenAddTypeModal(true);
                  }}
                >
                  Editar
                </Button>

                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={() => handleDelete(type.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </div>
            </Paper>
          ))}
        </div>
      ) : (
        <Paper className="empty-types">
          <Typography>No hay tipos de producto</Typography>
        </Paper>
      )}

      <AddItemTypeModal
        open={openAddTypeModal}
        onClose={() => {
          setOpenAddTypeModal(false);
          setEditingType(null);
        }}
        onCreated={async () => {
          await Promise.all([fetchTypes(), refetchStock?.()]);
          setOpenAddTypeModal(false);
        }}
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
    </section>
  );
};

export default ItemTypesSection;
