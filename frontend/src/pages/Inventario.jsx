import React, { useEffect, useState, useContext, useMemo } from 'react';
import {
  Box, Button, Paper, Typography,
  CircularProgress, Alert, 
  TableBody,
  TableCell, TableContainer, TableHead, TableRow, Table
} from '@mui/material';
import { Navigate } from 'react-router-dom';
import Modal from '@mui/material/Modal';

import InventoryFilters from '../components/Inventory/InventoryFilters.jsx';
import ItemTypesSection from '../components/Inventory/ItemTypesSection.jsx';
import PacksSection from '../components/Inventory/PacksSection.jsx';

import { useItemTypes } from '../hooks/itemType/useItemType.jsx';

import AddItemStockModal from '../components/AddItemStockModal.jsx';
import ItemStockTrash from '../components/ItemStockTrashModal.jsx';
import InventoryMovementHistory from '../components/InventoryMovementHistory.jsx';

import useItemStock from '../hooks/itemStock/useItemStock.jsx';
import useDeleteItemStock from '../hooks/itemStock/useDeleteItemStock.jsx';

import { useRestoreItemStock } from '../hooks/itemStock/useRestoreItemStock.jsx';
import { useDeletedItemStock } from '../hooks/itemStock/useDeletedItemStock.jsx';

import { AuthContext } from '../context/AuthContext.jsx';
import { deleteDataAlert, showSuccessAlert, showErrorAlert } from '../helpers/sweetAlert';

import { COLOR_DICTIONARY } from '../data/colorDictionary';
import { iconMap  } from '../data/iconCategories';
import '../styles/pages/inventario.css';


const Inventario = () => {
  //modales 
  const [openAddStock, setOpenAddStock] = useState(false);
  const [openStockTrash, setOpenStockTrash] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);

  //edicion
  const [editingStock, setEditingStock] = useState(null);

  const { isAuthenticated, user } = useContext(AuthContext);

  //hooks stock
  const { 
    itemStock, 
    loading: stockLoading, 
    error: stockError, 
    filters, 
    setFilters, 
    refetch: refetchStock 
  } = useItemStock();

  const { deleteItemStock } = useDeleteItemStock();
  const { deletedStock, fetchDeletedStock } = useDeletedItemStock();
  const { restore } = useRestoreItemStock();

  //hooks tipos
  const { types: itemTypes, fetchTypes, loading: typesLoading, error: typesError 
  } = useItemTypes();
  
  //carga inicial tipos
  useEffect(() => {
    fetchTypes(); 
  }, [fetchTypes]);

  //filtros
  const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

  const initialFilters = {
    color: '',
    size: '',
    typeId: '',
    searchTerm: '',
    stockStatus: ''
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const filteredStock = useMemo(() => {
    if (!itemStock) return [];
    
    return itemStock.filter(item => {
      if (!item.itemType) return false; 
      
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        const itemName = item.itemType?.name?.toLowerCase() || '';
        const itemHex = item.hexColor?.toLowerCase() || '';

        if (!itemName.includes(searchTerm) && !itemHex.includes(searchTerm)) {
          return false;
        }
      }
      if (filters.typeId && item.itemType.id !== filters.typeId) {
        return false;
      }
      if (filters.color) {
        const selectedHex = COLOR_DICTIONARY.find(c => c.name.toLowerCase() === filters.color.toLowerCase())?.hex;
        if (!selectedHex || item.hexColor?.toLowerCase() !== selectedHex.toLowerCase()) {
          return false;
        }
      }
      if (filters.size && item.size !== filters.size) {
        return false;
      }
      if (filters.stockStatus) {
        if (filters.stockStatus === 'low' && item.quantity > item.minStock) {
          return false;
        }
        if (filters.stockStatus === 'normal' && item.quantity <= item.minStock) {
          return false;
        }
      }
      return true;
    });
  }, [itemStock, filters]);

  //Handlers de Stock
  const handleDeleteStock = async (id) => {
    const result = await deleteDataAlert();

    if (!result.isConfirmed) return;

    const [res, err] = await deleteItemStock(id);
    console.log("resultado:", [res, err]);

    if (res && res.status === "Success") {
      showSuccessAlert('Eliminado', res.message || 'El item fue eliminado correctamente');
      refetchStock();
    } else if (err) {
      const { status, message } = err;

      if (status === 409) {
        showErrorAlert('No se puede eliminar', message || 'Este ítem está siendo utilizado en uno o más paquetes');
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
      const stockItem = deletedStock.find(item => item.id === id);
      if (!stockItem || !stockItem.itemType?.isActive) {
        showErrorAlert(
          'No se puede restaurar',
          'No puedes restaurar este stock porque su tipo de ítem aún está inactivo.'
        );
        return;
      }

      await restore(id);
      showSuccessAlert('Restaurado', 'El stock fue restaurado correctamente');

      await Promise.all([
        refetchStock(),
        fetchDeletedStock(),
        fetchTypes(),
      ]);

      setOpenStockTrash(false);
    } catch (error) {
      showErrorAlert('Error al restaurar', error?.message || 'Ocurrió un error inesperado');
    }
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
    const usedHexColors = new Set(
      itemStock
        .filter(item => item.hexColor)  
        .map(item => item.hexColor.toUpperCase()) 
    );

    return COLOR_DICTIONARY.filter(({ hex }) => 
      usedHexColors.has(hex.toUpperCase())
    );
  }, [itemStock]);

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

      {(!!stockLoading || !!typesLoading) ? (
        <div className="inventory-loading"><CircularProgress /></div>
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
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button variant="contained" className="inventory-button inventory-button--secondary" onClick={() => setOpenAddStock(true)}>
              Nuevo Stock
            </Button>
            <Button variant="outlined" color="secondary" className="inventory-button inventory-button--outlined" onClick={handleOpenStockTrashModal}>
              Papelera Stock
            </Button>
            <Button variant="outlined" color="info" className="inventory-button inventory-button--outlined" onClick={() => setOpenHistory(true)}>
              Historial
            </Button>
          </Box>

          <Typography variant="h5">Inventario</Typography>

          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Color</TableCell>
                  <TableCell>Talla</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Precio</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStock.map((item) => {
                  const stockClass =
                    item.quantity <= item.minStock
                      ? 'inventory-item-details--low-stock'
                      : item.quantity <= item.minStock * 1.2
                      ? 'inventory-item-details--warning-stock'
                      : '';

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.itemType?.iconName && iconMap[item.itemType.iconName]
                          ? React.createElement(iconMap[item.itemType.iconName], { size: 18, style: { marginRight: 4, verticalAlign: 'middle' } })
                          : null}
                        {item.itemType?.name}
                      </TableCell>
                      <TableCell>
                        {item.color}{' '}
                        {item.hexColor && (
                          <span
                            className="inventory-item-color-preview"
                            style={{
                              backgroundColor: item.hexColor,
                              display: 'inline-block',
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              marginLeft: 6,
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>{item.size || '-'}</TableCell>
                      <TableCell className={stockClass}>
                        {item.quantity} (Mín: {item.minStock})
                      </TableCell>
                      <TableCell>${item.price.toLocaleString()}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setEditingStock(item);
                              setOpenAddStock(true);
                            }}
                            className="inventory-button inventory-button--outlined inventory-button--small"
                          >
                            Editar
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleDeleteStock(item.id)}
                            className="inventory-button inventory-button--error inventory-button--small"
                          >
                            Eliminar
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Sección de Packs */}
        <PacksSection
            itemStock={itemStock} 
            refetchStock={refetchStock} 
          />
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
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Box sx={{
          width: '90%',
          maxHeight: '90%',
          overflowY: 'auto',
          bgcolor: 'background.paper',
          p: 4,
          borderRadius: 2,
          boxShadow: 24,
        }}>
          <Typography id="historial-inventario" variant="h6" gutterBottom>
            Historial de Movimientos de Inventario
          </Typography>
          <InventoryMovementHistory />
        </Box>
      </Modal>
    </Box>
    
  );
};

export default Inventario;