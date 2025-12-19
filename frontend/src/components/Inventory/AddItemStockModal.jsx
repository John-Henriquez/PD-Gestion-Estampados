import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Select, MenuItem, InputLabel, FormControl, Box, Typography,
  IconButton, Paper, Divider, Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeletePropertyIcon from '@mui/icons-material/DeleteForever';
import InventoryIcon from '@mui/icons-material/Inventory';

import { useRestockStock } from '../../hooks/itemStock/useRestockStock.jsx';
import useItemStock from '../../hooks/itemStock/useItemStock.jsx';
import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';
import '../../styles/components/modal.css';

const AddItemStockModal = ({ open, onClose, onCreated, itemTypes = [] }) => {

  const [groups, setGroups] = useState([]);
  const { itemStock: allStock } = useItemStock();
  const { restock, loading: restocking } = useRestockStock();

  useEffect(() => {
    if (!open) {
      setGroups([]);
    }
  }, [open]);
  
  // Añadir un nuevo grupo de producto al formulario
  const addProductGroup = () => {
    setGroups([...groups, { id: Date.now(), itemTypeId: '', variants: [] }]);
  };

  const removeProductGroup = (groupId) => {
    setGroups(groups.filter(g => g.id !== groupId));
  };

  // Al seleccionar un tipo de ítem, cargamos sus variantes existentes
  const handleTypeChange = (groupId, typeId) => {

    const isAlreadyAdded = groups.some(g => g.itemTypeId === typeId && g.id !== groupId);
    if (isAlreadyAdded) {
      return showErrorAlert('Producto duplicado', 'Este producto ya está en la lista de recarga.');
    }

    const variants = allStock
      .filter(s => s.itemType?.id === typeId && s.isActive)
      .map(s => ({
        stockId: s.id,
        colorName: s.color?.name,
        colorHex: s.color?.hex,
        size: s.size,
        currentQty: s.quantity,
        addedQty: 0 
      }));

    setGroups(groups.map(g => 
      g.id === groupId ? { ...g, itemTypeId: typeId, variants } : g
    ));
  };

  const handleQtyChange = (groupId, stockId, value) => {
    setGroups(groups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        variants: g.variants.map(v => 
          v.stockId === stockId ? { ...v, addedQty: parseInt(value) || 0 } : v
        )
      };
    }));
  };

  const handleSubmit = async () => {
    const flatRestockData = groups.flatMap(g => 
      g.variants
        .filter(v => v.addedQty > 0)
        .map(v => ({ id: v.stockId, addedQuantity: v.addedQty }))
    );

    if (flatRestockData.length === 0) {
      return showErrorAlert('Sin cambios', 'No has añadido cantidades a ninguna variante.');
    }

    try {
      const [res, err] = await restock(flatRestockData);
      
      if (res) {
        showSuccessAlert('¡Éxito!', 'Stock actualizado correctamente.');
        setGroups([]); 
        onCreated(); 
        onClose();  
      } else {
        showErrorAlert('Error', err || 'No se pudo procesar la recarga.');
      }
    } catch (error) {
      showErrorAlert('Error', 'Ocurrió un error inesperado en la comunicación.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" className="modal">
      <DialogTitle className="modal-title">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon color="primary" />
          <Typography variant="h6">Recarga Masiva de Stock</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers className="modal-content" sx={{ bgcolor: '#f4f6f8' }}>
        
        {groups.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 5, border: '2px dashed #ccc', borderRadius: 2 }}>
            <Typography color="textSecondary">No hay productos seleccionados.</Typography>
            <Button startIcon={<AddCircleIcon />} onClick={addProductGroup} sx={{ mt: 1 }}>
              Empezar recarga
            </Button>
          </Box>
        )}

        {groups.map((group) => (
          <Paper key={group.id} sx={{ p: 2, mb: 3, position: 'relative' }} elevation={2}>
            <IconButton 
              onClick={() => removeProductGroup(group.id)}
              sx={{ position: 'absolute', top: 8, right: 8 }}
              color="error" size="small"
            >
              <DeletePropertyIcon />
            </IconButton>

            {/* Selector de Producto */}
            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Seleccionar Producto</InputLabel>
                  <Select
                    value={group.itemTypeId}
                    label="Seleccionar Producto"
                    onChange={(e) => handleTypeChange(group.id, e.target.value)}
                  >
                    {itemTypes.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="textSecondary">
                  * Al seleccionar se cargarán todas las variantes activas.
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Listado de Variantes */}
            <Box>
              {group.variants.length === 0 && group.itemTypeId && (
                <Typography variant="body2" color="error">Este producto no tiene variantes creadas.</Typography>
              )}
              
              <Grid container spacing={1} sx={{ fontWeight: 'bold', mb: 1, px: 1 }}>
                <Grid item xs={5}><Typography variant="caption">VARIANTE (Color/Talla)</Typography></Grid>
                <Grid item xs={3}><Typography variant="caption" textAlign="center">STOCK ACTUAL</Typography></Grid>
                <Grid item xs={4}><Typography variant="caption">AÑADIR CANTIDAD</Typography></Grid>
              </Grid>

              {group.variants.map((v) => (
                <Box key={v.stockId} sx={{ 
                  display: 'flex', alignItems: 'center', p: 1, mb: 0.5, 
                  bgcolor: v.addedQty > 0 ? '#e3f2fd' : '#fff',
                  borderRadius: 1, border: '1px solid #eee'
                }}>
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={5} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 14, height: 14, bgcolor: v.colorHex, borderRadius: '50%', border: '1px solid #ccc' }} />
                      <Typography variant="body2">{v.colorName} {v.size ? `(${v.size})` : ''}</Typography>
                    </Grid>
                    <Grid item xs={3} textAlign="center">
                      <Typography variant="body2" fontWeight="bold">{v.currentQty}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        size="small"
                        type="number"
                        placeholder="0"
                        fullWidth
                        value={v.addedQty || ''}
                        onChange={(e) => handleQtyChange(group.id, v.stockId, e.target.value)}
                        InputProps={{ 
                          inputProps: { min: 0 },
                          endAdornment: v.addedQty > 0 ? (
                            <Typography variant="caption" sx={{ color: 'primary.main', ml: 1, whiteSpace: 'nowrap' }}>
                              Total: {v.currentQty + v.addedQty}
                            </Typography>
                          ) : null
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Box>
          </Paper>
        ))}

        {groups.length > 0 && (
          <Button startIcon={<AddCircleIcon />} onClick={addProductGroup} fullWidth variant="outlined" sx={{ borderStyle: 'dashed' }}>
            Añadir otro producto a la recarga
          </Button>
        )}
      </DialogContent>

      <DialogActions className="modal-actions">
        <Button onClick={onClose} className="modal-button modal-button--cancel">Cerrar</Button>
        <Button 
          onClick={handleSubmit}
          variant="contained" 
          className="modal-button modal-button--primary"
          disabled={groups.length === 0}
        >
          Finalizar Recarga Masiva
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddItemStockModal;