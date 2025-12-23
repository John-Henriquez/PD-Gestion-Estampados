import React, { useState } from 'react';
import { Box, Button, Paper, Typography, Chip, IconButton, Tooltip, Grid } from '@mui/material';
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
      <header className="section-header">
        <Box className="header-title-area">
          <CategoryIcon color="primary" />
          <Typography variant="h5" fontWeight="700">
            Tipos de productos
          </Typography>
          <Chip label={itemTypes.length} size="small" className="count-chip" />
        </Box>

        <Box className="header-actions">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            className="action-btn primary-grad"
            onClick={() => handleOpenAddModal()}
          >
            Nuevo Tipo
          </Button>
          <Tooltip title="Ver Papelera">
            <IconButton onClick={handleOpenTrash} className="trash-icon-btn">
              <DeleteSweepIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </header>

      {itemTypes.length > 0 ? (
        <Grid container spacing={2} className="types-grid">
          {itemTypes.map((type) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={type.id}>
              <Paper className="type-card" elevation={0}>
                <Box className="type-card-main">
                  <div className="icon-wrapper">
                    {type.iconName && iconMap[type.iconName] ? (
                      React.createElement(iconMap[type.iconName], { size: 28 })
                    ) : (
                      <CategoryIcon size={28} />
                    )}
                  </div>
                  
                  <div className="type-info">
                    <Typography className="type-name" variant="subtitle1">
                      {type.name}
                    </Typography>
                    <Box className="type-badges">
                      {type.hasSizes ? (
                        <Chip label="Con Tallas" size="small" variant="outlined" className="badge-size" />
                      ) : (
                        <Chip label="Talla Única" size="small" variant="outlined" />
                      )}
                      {type.stocks?.length > 0 && (
                        <Chip 
                          label={`${type.stocks.length} SKU`} 
                          size="small" 
                          className="badge-stock"
                        />
                      )}
                    </Box>
                  </div>
                </Box>

                <div className="type-card-actions">
                  <Button 
                    startIcon={<EditIcon />} 
                    size="small" 
                    onClick={() => handleOpenAddModal(type)}
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
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper className="empty-types-state">
          <Typography color="textSecondary">No hay tipos de producto registrados.</Typography>
        </Paper>
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
    </section>
  );
};

export default ItemTypesSection;
