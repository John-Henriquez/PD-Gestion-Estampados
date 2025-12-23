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
import PostAddIcon from '@mui/icons-material/PostAdd';

import { useRestockStock } from '../../hooks/itemStock/useRestockStock.jsx';
import { useCreateItemStock } from '../../hooks/itemStock/useCreateItemStock.jsx';
import { useColors } from '../../hooks/color/useColors.jsx';
import useItemStock from '../../hooks/itemStock/useItemStock.jsx';
import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';
import '../../styles/components/inventoryManagementModal.css';

const InventoryManagementModal = ({ open, onClose, onCreated, itemTypes = [] }) => {
  // --- ESTADOS RECARGA (IZQUIERDA) ---
  const [groups, setGroups] = useState([]);
  const { itemStock: allStock } = useItemStock();
  const { restock, loading: restocking } = useRestockStock();

  // --- ESTADOS CREACIÓN (DERECHA) ---
  const { colors } = useColors();
  const { addStock, loading: creating } = useCreateItemStock();
  const [creations, setCreations] = useState([
    { id: Date.now(), itemTypeId: '', colorId: '', size: '', quantity: 0, hasSizes: false }
  ]);

  useEffect(() => {
    if (!open) {
      setGroups([]);
      setCreations([{ id: Date.now(), itemTypeId: '', colorId: '', size: '', quantity: 0, hasSizes: false }]);
    }
  }, [open]);

  // --- LÓGICA RECARGA (IZQUIERDA) ---
  const addProductGroup = () => setGroups([...groups, { id: Date.now(), itemTypeId: '', variants: [] }]);
  const removeProductGroup = (groupId) => setGroups(groups.filter(g => g.id !== groupId));

  const handleTypeChangeRestock = (groupId, typeId) => {
    if (groups.some(g => g.itemTypeId === typeId && g.id !== groupId)) {
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
    setGroups(groups.map(g => g.id === groupId ? { ...g, itemTypeId: typeId, variants } : g));
  };

  const handleQtyChange = (groupId, stockId, value) => {
    setGroups(groups.map(g => g.id === groupId ? {
      ...g,
      variants: g.variants.map(v => v.stockId === stockId ? { ...v, addedQty: parseInt(value) || 0 } : v)
    } : g));
  };

  // --- LÓGICA CREACIÓN (DERECHA) ---
  const addCreationRow = () => {
    setCreations([...creations, { id: Date.now(), itemTypeId: '', colorId: '', size: '', quantity: 0, hasSizes: false }]);
  };

  const removeCreationRow = (id) => {
    if (creations.length > 1) setCreations(creations.filter(c => c.id !== id));
  };

  const handleCreationChange = (id, field, value) => {
    setCreations(creations.map(c => {
      if (c.id !== id) return c;
      let extra = {};
      if (field === 'itemTypeId') {
        const type = itemTypes.find(t => t.id === value);
        extra = { hasSizes: type?.hasSizes || false, size: '' };
      }
      return { ...c, [field]: value, ...extra };
    }));
  };

  // --- SUBMIT GLOBAL ---
  const handleProcessAll = async () => {
    try {
      // 1. Procesar Recargas
      const restockData = groups.flatMap(g => g.variants.filter(v => v.addedQty > 0).map(v => ({ id: v.stockId, addedQuantity: v.addedQty })));
      
      // 2. Procesar Creaciones
      const createData = creations.filter(c => c.itemTypeId && c.colorId);

      if (restockData.length === 0 && createData.length === 0) {
        return showErrorAlert('Sin datos', 'No hay información válida para procesar.');
      }

      if (restockData.length > 0) await restock(restockData);
      if (createData.length > 0) await addStock(createData);

      showSuccessAlert('¡Éxito!', 'Operaciones de inventario completadas.');
      onCreated();
      onClose();
    } catch (error) {
      showErrorAlert('Error', error.message || 'Error al procesar el inventario.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl" className="modal">
      <DialogTitle className="modal-title">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon color="primary" />
          <Typography variant="h6">Gestión de Inventario (Recarga y Creación)</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: '#f0f2f5', p: 0 }}>
        <Grid container sx={{ minHeight: '60vh' }}>
          
          {/* SECCIÓN IZQUIERDA: RECARGA */}
          <Grid item xs={12} md={6} sx={{ p: 3, borderRight: { md: '2px solid #ddd' } }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InventoryIcon fontSize="small" /> RECARGA DE STOCK EXISTENTE
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
              Añade unidades a combinaciones que ya están registradas.
            </Typography>

            {groups.map((group) => (
              <Paper key={group.id} sx={{ p: 2, mb: 2, position: 'relative' }} elevation={1}>
                <IconButton onClick={() => removeProductGroup(group.id)} sx={{ position: 'absolute', top: 5, right: 5 }} color="error" size="small"><DeletePropertyIcon /></IconButton>
                <FormControl fullWidth size="small" sx={{ mb: 2, mt: 1 }}>
                  <InputLabel>Producto a recargar</InputLabel>
                  <Select value={group.itemTypeId} label="Producto a recargar" onChange={(e) => handleTypeChangeRestock(group.id, e.target.value)}>
                    {itemTypes.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                  </Select>
                </FormControl>
                {group.variants.map((v) => (
                  <Box key={v.stockId} sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: v.colorHex, borderRadius: '50%', border: '1px solid #ccc' }} />
                    <Typography variant="body2" sx={{ flex: 1 }}>{v.colorName} {v.size ? `(${v.size})` : ''}</Typography>
                    <Typography variant="caption" sx={{ width: 40 }}>{v.currentQty}</Typography>
                    <TextField size="small" type="number" sx={{ width: 80 }} placeholder="+0" onChange={(e) => handleQtyChange(group.id, v.stockId, e.target.value)} />
                  </Box>
                ))}
              </Paper>
            ))}
            <Button startIcon={<AddCircleIcon />} onClick={addProductGroup} fullWidth variant="outlined" size="small" sx={{ borderStyle: 'dashed' }}>
              Añadir producto para recarga
            </Button>
          </Grid>

          {/* SECCIÓN DERECHA: CREACIÓN */}
          <Grid item xs={12} md={6} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PostAddIcon fontSize="small" /> CREACIÓN DE NUEVO STOCK
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
              Crea nuevas combinaciones de tipo, color y talla.
            </Typography>

            {creations.map((c) => (
              <Paper key={c.id} sx={{ p: 2, mb: 2, position: 'relative', bgcolor: '#fff' }} elevation={1}>
                <IconButton onClick={() => removeCreationRow(c.id)} sx={{ position: 'absolute', top: 5, right: 5 }} color="error" size="small"><DeletePropertyIcon /></IconButton>
                <Grid container spacing={1} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Tipo de Artículo</InputLabel>
                      <Select value={c.itemTypeId} label="Tipo de Artículo" onChange={(e) => handleCreationChange(c.id, 'itemTypeId', e.target.value)}>
                        {itemTypes.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={c.hasSizes ? 4 : 8}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Color</InputLabel>
                      <Select value={c.colorId} label="Color" onChange={(e) => handleCreationChange(c.id, 'colorId', e.target.value)}>
                        {colors.map(col => <MenuItem key={col.id} value={col.id}>{col.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  {c.hasSizes && (
                    <Grid item xs={4}>
                      <TextField fullWidth size="small" label="Talla" value={c.size} onChange={(e) => handleCreationChange(c.id, 'size', e.target.value)} />
                    </Grid>
                  )}
                  <Grid item xs={4}>
                    <TextField fullWidth size="small" type="number" label="Cant. Inicial" value={c.quantity} onChange={(e) => handleCreationChange(c.id, 'quantity', e.target.value)} />
                  </Grid>
                </Grid>
              </Paper>
            ))}
            <Button startIcon={<AddCircleIcon />} onClick={addCreationRow} fullWidth variant="outlined" color="secondary" size="small" sx={{ borderStyle: 'dashed' }}>
              Añadir otra combinación nueva
            </Button>
          </Grid>

        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#fff' }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button onClick={handleProcessAll} variant="contained" disabled={restocking || creating}>
          Procesar Todo el Inventario
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InventoryManagementModal;