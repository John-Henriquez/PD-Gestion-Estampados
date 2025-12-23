import { useEffect, useState, useContext, useMemo } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Paper, Typography, Modal, Container, useMediaQuery, useTheme, Tooltip, IconButton } from '@mui/material';
import { Navigate } from 'react-router-dom';

import InventoryIcon from '@mui/icons-material/Inventory';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import HistoryIcon from '@mui/icons-material/History';
import AddBoxIcon from '@mui/icons-material/AddBox';

import InventoryFilters from '../components/Inventory/InventoryFilters.jsx';
import ItemTypesSection from '../components/Inventory/ItemTypesSection.jsx';
import PacksSection from '../components/Inventory/PacksSection.jsx';
import ItemStockTable from '../components/Inventory/ItemStockTable.jsx';

import { useItemTypes } from '../hooks/itemType/useItemType.jsx';
import { useColors } from '../hooks/color/useColors.jsx';

import InventoryManagementModal from '../components/Inventory/InventoryManagementModal.jsx';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [openInventoryModal, setOpenInventoryModal] = useState(false);
  const [openStockTrash, setOpenStockTrash] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const [editingStock, setEditingStock] = useState(null);

  const { isAuthenticated, user } = useContext(AuthContext);
  const { colors: dbColors } = useColors();

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
  const { types: itemTypes, fetchTypes, loading: typesLoading, error: typesError } = useItemTypes();

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const handleFullRefresh = async () => {
    await Promise.all([fetchTypes(), refetchStock(), fetchDeletedStock()]);
  };

  const filteredStock = useMemo(() => {
    if (!itemStock) return [];
    return itemStock.filter((item) => {
      if (!item.itemType) return false;
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        const matches = (item.itemType?.name?.toLowerCase() || '').includes(search) || 
                        (item.color?.name?.toLowerCase() || '').includes(search);
        if (!matches) return false;
      }
      if (filters.typeId && item.itemType.id !== filters.typeId) return false;
      if (filters.color && item.color?.id !== parseInt(filters.color)) return false;
      if (filters.size && item.size !== filters.size) return false;
      if (filters.stockStatus) {
        if (filters.stockStatus === 'low' && item.quantity > item.minStock) return false;
        if (filters.stockStatus === 'normal' && item.quantity <= item.minStock) return false;
      }
      return true;
    });
  }, [itemStock, filters]);

  const handleDeleteStock = async (id) => {
    const result = await deleteDataAlert();
    if (!result.isConfirmed) return;
    const [res, err] = await deleteItemStock(id);
    if (res?.status === 'Success' || res) {
      showSuccessAlert('Eliminado', 'Item desactivado correctamente');
      refetchStock();
    } else {
      showErrorAlert('Error', err?.message || 'No se pudo eliminar');
    }
  };

  const handleEditStock = (item) => {
    setEditingStock(item);
    console.log("Editando item:", item);
  };

  if (!isAuthenticated || user?.rol !== 'administrador') return <Navigate to="/auth" />;

  return (
    <Container maxWidth="xl" className="inventory-page-wrapper">
     <Box sx={{ mt: { xs: 2, md: 4 } }}></Box>
        <header className="inventory-header-section">
          <Box>
            <Typography className="inventory-main-title" variant="h4">
              Panel de Inventario
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Gestiona existencias, tipos de productos y combinaciones masivas.
            </Typography>
          </Box>

        <Box className="inventory-global-actions">
          <Button 
            variant="outlined" 
            startIcon={<HistoryIcon />}
            className="action-btn outline-info"
            onClick={() => setOpenHistory(true)}
            fullWidth={isMobile}
          >
            Historial
          </Button>
        </Box>
      </header>

      {(stockError || typesError) && (
        <Alert severity="error" variant="filled" sx={{ mb: 3, borderRadius: '12px' }}>
          {stockError || typesError}
        </Alert>
      )}

      <section className="inventory-filters-area">
        <InventoryFilters
          filters={filters}
          onFilterChange={(e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }))}
          onResetFilters={() => setFilters({ color: '', size: '', typeId: '', searchTerm: '', stockStatus: '' })}
          itemTypes={itemTypes}
          colorOptions={dbColors}
        />
      </section>

      {stockLoading || typesLoading ? (
        <Box className="inventory-centered-loader">
          <CircularProgress size={60} thickness={4} />
          <Typography sx={{ mt: 2 }}>Sincronizando existencias...</Typography>
        </Box>
      ) : (
        <div className="inventory-content-grid">
          {/* Tipos de Artículos */}
          <ItemTypesSection itemTypes={itemTypes} fetchTypes={fetchTypes} refetchStock={handleFullRefresh} />

          {/* Tabla de Existencias */}
          <Paper className="inventory-main-paper" elevation={0}>
          <div className="paper-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" fontWeight="700">Existencias</Typography>
              <Chip label={`${filteredStock.length} Variantes`} color="primary" variant="outlined" size="small" />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                  variant="contained"
                  startIcon={<AddBoxIcon />}
                  className="action-btn primary-grad"
                  onClick={() => setOpenInventoryModal(true)}
                  fullWidth={isMobile}
                >
                  Carga Masiva
                </Button>

              <Tooltip title="Ver Stock Eliminado">
                <IconButton 
                  onClick={async () => {
                    await fetchDeletedStock(); 
                    setOpenStockTrash(true);
                  }} 
                  className="trash-icon-btn"
                  sx={{ color: 'var(--gray-500)' }}
                >
                  <DeleteSweepIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </div>

          <ItemStockTable 
            stockItems={filteredStock} 
            onDelete={handleDeleteStock} 
            loading={stockLoading} 
          />
        </Paper>

          <PacksSection itemStock={itemStock} refetchStock={refetchStock} />
        </div>
      )}

      {/* Modales */}
      <InventoryManagementModal
        open={openInventoryModal}
        onClose={() => setOpenInventoryModal(false)}
        onCreated={handleFullRefresh}
        itemTypes={itemTypes}
      />

      <ItemStockTrash
        open={openStockTrash}
        onClose={() => setOpenStockTrash(false)}
        trashedItems={deletedStock || []}
        onRestore={async (id) => { await restore(id); handleFullRefresh(); }}
        onRefresh={handleFullRefresh}
      />

      <Modal open={openHistory} onClose={() => setOpenHistory(false)} className="responsive-modal-container">
        <Box className="history-modal-box">
          <InventoryMovementHistory onClose={() => setOpenHistory(false)} />
        </Box>
      </Modal>
    </Container>
  );
};

export default Inventario;