import { useEffect, useState, useContext, useMemo } from 'react';
import { 
  Alert, Box, Button, Chip, CircularProgress, Paper,
  Typography, Modal, Container, Grid, useMediaQuery, useTheme,
  Tooltip, IconButton 
} from '@mui/material';
import { Navigate } from 'react-router-dom';

import HistoryIcon from '@mui/icons-material/History';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import AddBoxIcon from '@mui/icons-material/AddBox';

import InventoryFilters from '../components/Inventory/InventoryFilters.jsx';
import ItemTypesSection from '../components/Inventory/ItemTypesSection.jsx';
import PacksSection from '../components/Inventory/PacksSection.jsx';
import ItemStockTable from '../components/Inventory/ItemStockTable.jsx';

import InventoryManagementModal from '../components/Inventory/InventoryManagementModal.jsx';
import ItemStockTrash from '../components/Inventory/ItemStockTrashModal.jsx';
import InventoryMovementHistory from '../components/Inventory/InventoryMovementHistory.jsx';

import { useItemTypes } from '../hooks/itemType/useItemType.jsx';
import { useColors } from '../hooks/color/useColors.jsx';

import useItemStock from '../hooks/itemStock/useItemStock.jsx';
import useDeleteItemStock from '../hooks/itemStock/useDeleteItemStock.jsx';
import { useRestoreItemStock } from '../hooks/itemStock/useRestoreItemStock.jsx';
import { useDeletedItemStock } from '../hooks/itemStock/useDeletedItemStock.jsx';

import { AuthContext } from '../context/AuthContext.jsx';
import { 
  deleteDataAlert, showSuccessAlert, showErrorAlert 
} from '../helpers/sweetAlert';

import '../styles/pages/inventario.css';

const Inventario = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [openInventoryModal, setOpenInventoryModal] = useState(false);
  const [openStockTrash, setOpenStockTrash] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);

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
  const {
    types: itemTypes,
    fetchTypes,
    loading: typesLoading,
    error: typesError
  } = useItemTypes();

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const handleFullRefresh = async () => {
    await Promise.all([
      fetchTypes(),
      refetchStock(),
      fetchDeletedStock(),
    ]);
  };

  const filteredStock = useMemo(() => {
    if (!itemStock) return [];

    return itemStock.filter((item) => {
      if (!item.itemType) return false;

      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        const matches = 
          (item.itemType?.name?.toLowerCase() || '').includes(search) || 
          (item.color?.name?.toLowerCase() || '').includes(search);
        if (!matches) return false;
      }
      if (filters.typeId && item.itemType.id !== filters.typeId) return false;
      if (filters.color && item.color?.id !== parseInt(filters.color)) return false;
      if (filters.size && item.size !== filters.size) return false;

      if (filters.stockStatus) {
        if (filters.stockStatus === 'low' && item.quantity > item.minStock)
          return false;
        if (filters.stockStatus === 'normal' && item.quantity <= item.minStock)
          return false;
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

  if (!isAuthenticated || user?.rol !== 'administrador') {
    return <Navigate to="/auth" />;
  }

  const isLoading = stockLoading || typesLoading;
  const hasError = stockError || typesError;

  return (
    <Container maxWidth="xl" className="inventory-page">
      <Box component="header" className="inventory-header">
        <Box>
          <Typography variant="h4" className="inventory-title">
            Panel de Inventario
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestiona existencias, tipos de productos y combinaciones masivas.
          </Typography>
        </Box>

        <Button 
          variant="outlined" 
          startIcon={<HistoryIcon />}
          onClick={() => setOpenHistory(true)}
          fullWidth={isMobile}
        >
          Historial
        </Button>
      </Box>

      {hasError && (
        <Alert severity="error" variant="filled" className="inventory-alert">
          {stockError || typesError}
        </Alert>
      )}

      <Box className="inventory-filters">
        <InventoryFilters
          filters={filters}
          onFilterChange={(e) => 
            setFilters(prev => ({ 
              ...prev,
              [e.target.name]: e.target.value,
            }))
          }
          onResetFilters={() => 
            setFilters({ 
              color: '',
              size: '',
              typeId: '',
              searchTerm: '',
              stockStatus: '',
            })
          }
          itemTypes={itemTypes}
          colorOptions={dbColors}
        />
      </Box>

      {isLoading ? (
        <Box className="inventory-loader">
          <CircularProgress size={56} />
          <Typography>Sincronizando existencias...</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {/* Tipos */}
          <Grid item xs={12}>
            <ItemTypesSection
              itemTypes={itemTypes}
              fetchTypes={fetchTypes}
              refetchStock={handleFullRefresh}
            />
          </Grid>

          {/* Stock */}
          <Grid item xs={12}>
            <Paper className="inventory-paper" elevation={0}>
              <Box className="inventory-paper-header">
                <Box className="inventory-paper-title">
                  <Typography variant="h5">Existencias</Typography>
                  <Chip
                    label={`${filteredStock.length} Variantes`}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Box className="inventory-paper-actions">
                  <Button
                    variant="contained"
                    startIcon={<AddBoxIcon />}
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
                    >
                      <DeleteSweepIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Box className="inventory-table-wrapper">
                <ItemStockTable 
                  stockItems={filteredStock} 
                  onDelete={handleDeleteStock}
                  loading={stockLoading} 
                />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <PacksSection
              itemStock={itemStock}
              refetchStock={refetchStock} 
            />
          </Grid>
        </Grid>
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
        onRestore={async (id) => {
          await restore(id);
          handleFullRefresh(); 
        }}
        onRefresh={handleFullRefresh}
      />

      <Modal open={openHistory} onClose={() => setOpenHistory(false)}>
        <Box className="inventory-history-modal">
          <InventoryMovementHistory
            onClose={() => setOpenHistory(false)}
          />
        </Box>
      </Modal>
    </Container>
  );
};

export default Inventario;