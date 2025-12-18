import { useEffect, useState, useContext, useMemo } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Typography, Modal } from '@mui/material';
import { Navigate } from 'react-router-dom';

import InventoryFilters from '../components/Inventory/InventoryFilters.jsx';
import ItemTypesSection from '../components/Inventory/ItemTypesSection.jsx';
import PacksSection from '../components/Inventory/PacksSection.jsx';
import ItemStockTable from '../components/Inventory/ItemStockTable.jsx';

import { useItemTypes } from '../hooks/itemType/useItemType.jsx';
import { useColors } from '../hooks/color/useColors.jsx';

import AddItemStockModal from '../components/Inventory/AddItemStockModal.jsx';
import ItemStockTrash from '../components/Inventory/ItemStockTrashModal.jsx';
import InventoryMovementHistory from '../components/Inventory/InventoryMovementHistory.jsx';

import useItemStock from '../hooks/itemStock/useItemStock.jsx';
import useDeleteItemStock from '../hooks/itemStock/useDeleteItemStock.jsx';

import { useRestoreItemStock } from '../hooks/itemStock/useRestoreItemStock.jsx';
import { useDeletedItemStock } from '../hooks/itemStock/useDeletedItemStock.jsx';

import { AuthContext } from '../context/AuthContext.jsx';
import { deleteDataAlert, showSuccessAlert, showErrorAlert } from '../helpers/sweetAlert';

import '../styles/pages/inventario.css';

const Inventario = () => {
  //modales
  const [openAddStock, setOpenAddStock] = useState(false);
  const [openStockTrash, setOpenStockTrash] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);

  useEffect(() => {
    const isModalOpen = openAddStock || openStockTrash || openHistory;

    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [openAddStock, openStockTrash, openHistory]);

  //edicion
  const [editingStock, setEditingStock] = useState(null);

  const { isAuthenticated, user } = useContext(AuthContext);

  const { colors: dbColors, loading: colorsLoading } = useColors();

  //hooks stock
  const {
    itemStock,
    loading: stockLoading,
    error: stockError,
    filters,
    setFilters,
    refetch: refetchStock,
  } = useItemStock();

  const { deleteItemStock } = useDeleteItemStock();
  const { deletedStock, fetchDeletedStock } = useDeletedItemStock();
  const { restore } = useRestoreItemStock();

  //hooks tipos
  const { types: itemTypes, fetchTypes, loading: typesLoading, error: typesError } = useItemTypes();

  //carga inicial tipos
  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  //filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const initialFilters = {
    color: '',
    size: '',
    typeId: '',
    searchTerm: '',
    stockStatus: '',
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const filteredStock = useMemo(() => {
    if (!itemStock) return [];

    return itemStock.filter((item) => {
      if (!item.itemType) return false;

      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        const itemName = item.itemType?.name?.toLowerCase() || '';
        const colorName = item.color?.name?.toLowerCase() || '';
        const colorHex = item.color?.hex?.toLowerCase() || item.hexColor?.toLowerCase() || '';

        if (!itemName.includes(searchTerm) && !colorName.includes(searchTerm) && !colorHex.includes(searchTerm)) {
          return false;
        }
      }

      if (filters.typeId && item.itemType.id !== filters.typeId) {
        return false;
      }

      if (filters.color) {
        if (item.color?.id !== parseInt(filters.color)) {
          return false;
        }
      }

      if (filters.size && item.size !== filters.size) {
        return false;
      }

      if (filters.stockStatus) {
        if (filters.stockStatus === 'low' && item.quantity > item.minStock) return false;
        if (filters.stockStatus === 'normal' && item.quantity <= item.minStock) return false;
      }
      return true;
    });
  }, [itemStock, filters]);

  //Handlers de Stock
  const handleDeleteStock = async (id) => {
    const result = await deleteDataAlert();

    if (!result.isConfirmed) return;

    const [res, err] = await deleteItemStock(id);
    console.log('resultado:', [res, err]);

    if (res && res.status === 'Success') {
      showSuccessAlert('Eliminado', res.message || 'El item fue eliminado correctamente');
      refetchStock();
    } else if (err) {
      const { status, message } = err;

      if (status === 409) {
        showErrorAlert(
          'No se puede eliminar',
          message || 'Este ítem está siendo utilizado en uno o más paquetes'
        );
      } else if (status === 404) {
        showErrorAlert('No encontrado', message || 'El ítem no existe o ya fue eliminado');
      } else {
        showErrorAlert('Error', message || `Error inesperado (${status})`);
      }
    } else {
      showErrorAlert('Error', 'No se pudo determinar el resultado de la operación');
    }
  };
  const handleRestoreStock = async (id) => {
    try {
      const stockItem = deletedStock.find((item) => item.id === id);
      if (!stockItem || !stockItem.itemType?.isActive) {
        showErrorAlert(
          'No se puede restaurar',
          'No puedes restaurar este stock porque su tipo de ítem aún está inactivo.'
        );
        return;
      }

      await restore(id);
      showSuccessAlert('Restaurado', 'El stock fue restaurado correctamente');

      await Promise.all([refetchStock(), fetchDeletedStock(), fetchTypes()]);

      setOpenStockTrash(false);
    } catch (error) {
      showErrorAlert('Error al restaurar', error?.message || 'Ocurrió un error inesperado');
    }
  };
  const handleEditStock = (itemRow) => {
    setEditingStock(itemRow._original || itemRow);
    setOpenAddStock(true);
  };

  //Handlers para abrir modales
  const handleOpenStockTrashModal = async () => {
    try {
      await fetchDeletedStock();
      setOpenStockTrash(true);
    } catch (err) {
      console.error('[Inventario] Error al obtener stock eliminados:', err);
    }
  };
  const handleCloseStockTrash = () => {
    setOpenStockTrash(false);
  };

  //colores
  const colorOptions = useMemo(() => {
    if (!itemStock || !dbColors) return [];

    const usedColorIds = new Set(
      itemStock
        .filter(i => i.color?.id)
        .map(i => i.color.id)
    );
    return dbColors.filter(c => usedColorIds.has(c.id));
  }, [itemStock, dbColors]);

  if (!isAuthenticated || user?.rol !== 'administrador') {
    return <Navigate to="/auth" />;
  }

  return (
    <Box className="inventory-container">
      <Typography className="inventory-title" variant="h4" gutterBottom>
        Gestión de Inventario
      </Typography>
      {/* Alertas de error */}
      {(stockError || typesError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {stockError || typesError}
        </Alert>
      )}

      {/* Sección de Filtros */}
      <InventoryFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={resetFilters}
        itemTypes={itemTypes}
        colorOptions={colorOptions}
      />

      {!!stockLoading || !!typesLoading ? (
        <div className="inventory-loading">
          <CircularProgress />
        </div>
      ) : (
        <>
          {/* Sección de Tipos */}
          <ItemTypesSection
            itemTypes={itemTypes}
            fetchTypes={fetchTypes}
            refetchStock={refetchStock}
          />

          {/* Sección de Inventario */}
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
              <Typography variant="h5">Inventario</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  className="inventory-button inventory-button--secondary"
                  onClick={() => {
                    setEditingStock(null);
                    setOpenAddStock(true);
                  }}
                >
                  {' '}
                  Nuevo Stock{' '}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  className="inventory-button inventory-button--outlined"
                  onClick={handleOpenStockTrashModal}
                >
                  {' '}
                  Papelera Stock{' '}
                </Button>
                <Button
                  variant="outlined"
                  color="info"
                  className="inventory-button inventory-button--outlined"
                  onClick={() => setOpenHistory(true)}
                >
                  {' '}
                  Historial{' '}
                </Button>
              </Box>
            </Box>

            <ItemStockTable
              stockItems={filteredStock}
              onEdit={handleEditStock}
              onDelete={handleDeleteStock}
              loading={stockLoading}
            />
          </Paper>

          {/* Sección de Packs */}
          <PacksSection itemStock={itemStock} refetchStock={refetchStock} />
        </>
      )}
      {/* modales*/}
      <ItemStockTrash
        open={openStockTrash}
        onClose={handleCloseStockTrash}
        trashedItems={Array.isArray(deletedStock) ? deletedStock : []}
        onRestore={handleRestoreStock}
        onRefresh={() => {
          fetchDeletedStock();
          refetchStock();
        }}
      />
      <AddItemStockModal
        open={openAddStock}
        onClose={() => setOpenAddStock(false)}
        onCreated={() => {
          refetchStock();
          setEditingStock(null);
        }}
        itemTypes={itemTypes}
        editingStock={openAddStock ? editingStock : null}
      />
      <Modal
        open={openHistory}
        onClose={() => setOpenHistory(false)}
        aria-labelledby="historial-inventario"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            width: '90%',
            maxHeight: '90%',
            overflowY: 'auto',
            bgcolor: 'background.paper',
            p: 4,
            borderRadius: 2,
            boxShadow: 24,
            position: 'relative',
          }}
        >
          <InventoryMovementHistory onClose={() => setOpenHistory(false)} />
        </Box>
      </Modal>
    </Box>
  );
};

export default Inventario;
