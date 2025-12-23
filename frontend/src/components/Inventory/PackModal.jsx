import { useEffect, useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, 
  IconButton, Typography, Select, MenuItem, FormControl, InputLabel, 
  Grid, Divider, Chip, InputAdornment, useMediaQuery, useTheme, Paper
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Search as SearchIcon, 
  AddShoppingCart as AddIcon,
  LocalOffer as TagIcon,
  Inventory as InventoryIcon,
  Close as CloseIcon
} from '@mui/icons-material';

import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';
import useCreatePack from '../../hooks/pack/useCreatePack.jsx';
import useEditPack from '../../hooks/pack/useEditPack.jsx';

import '../../styles/components/packModal.css';

const DEFAULT_FORM = { name: '', description: '', discount: '', isActive: true };

const PackModal = ({ open, onClose, onCompleted, editingPack, currentUserRut, itemStock, refetchStocks }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [form, setForm] = useState(DEFAULT_FORM);
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const { create, loading: creating } = useCreatePack();
  const { edit: editPack, loading: editing } = useEditPack();

  const filteredAvailableStocks = useMemo(() => {
    if (!itemStock) return [];
    return itemStock.filter(s => 
      s.itemType?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.color?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [itemStock, searchTerm]);

  useEffect(() => {
    if (!open) {
      setForm(DEFAULT_FORM);
      setSelectedStocks([]);
      setSearchTerm('');
      return;
    }

    if (editingPack && Array.isArray(editingPack.packItems)) {
      const initialStocks = editingPack.packItems.map((pi) => ({
        itemStock: pi.itemStock,
        quantity: pi.quantity.toString(),
        stampingLevel: pi.sstampingLevels || '',
      }));
      setSelectedStocks(initialStocks);
      setForm({
        name: editingPack.name || '',
        description: editingPack.description || '',
        discount: (editingPack.discount || 0) * 100,
        isActive: editingPack.isActive ?? true,
      });
    }
  }, [open, editingPack]);

  const getPriceForItem = (stockData) => {
    const { itemStock, stampingLevel } = stockData;
    if (stampingLevel && itemStock.itemType?.stampingLevels) {
      const levelObj = itemStock.itemType.stampingLevels.find((l) => l.level === stampingLevel);
      if (levelObj && levelObj.price !== undefined) return Number(levelObj.price) || 0;
    }
    return Number(itemStock.price || itemStock.itemType?.basePrice || 0);
  };

  const calculateSubtotal = () => {
    return selectedStocks.reduce((sum, s) => {
      const { itemStock, stampingLevel } = s;
      let itemPrice = Number(itemStock.price || 0);
      
      if (stampingLevel && itemStock.itemType?.stampingLevels) {
        const lvl = itemStock.itemType.stampingLevels.find(l => l.level === stampingLevel);
        if (lvl) itemPrice = Number(lvl.price);
      }
      return sum + (itemPrice * Number(s.quantity || 1));
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const total = subtotal * (1 - (Number(form.discount || 0) / 100));

  const handleSelectStock = (stock) => {
    if (selectedStocks.some(s => s.itemStock.id === stock.id)) return;
    const defaultLevel = stock.itemType?.stampingLevels?.[0]?.level || '';
    setSelectedStocks(prev => [...prev, { 
      itemStock: stock, 
      quantity: '1', 
      stampingLevel: defaultLevel 
    }]);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || selectedStocks.length === 0) {
      return showErrorAlert('Campos incompletos', 'Debes completar nombre y al menos un ítem.');
    }
    if (Number(form.discount) < 0) return showErrorAlert('Datos inválidos', 'El descuento no puede ser negativo.');
    
    if (selectedStocks.some(s => !s.quantity || Number(s.quantity) <= 0)) {
      return showErrorAlert('Cantidad inválida', 'Cada ítem debe tener cantidad mayor a 0.');
    }

    if (!currentUserRut) return showErrorAlert('Usuario no identificado', 'Error de sesión.');

    const payload = {
      ...form,
      price: subtotal,
      discount: (Number(form.discount) || 0) / 100,
      isActive: form.isActive,
      items: selectedStocks.map(s => ({
        itemStockId: s.itemStock.id,
        quantity: parseInt(s.quantity, 10),
        stampingLevel: s.stampingLevel || null,
      })),
      [editingPack ? 'updatedById' : 'createdById']: currentUserRut
    };

    try {
      if (editingPack) await editPack(editingPack.id, payload);
      else await create(payload);

      showSuccessAlert('Pack creado', 'El pack fue creado con éxito');
      await refetchStocks();
      onCompleted();
      onClose();
    } catch (e) {
      showErrorAlert('Error', e.response?.data?.message || e.message || 'Error inesperado');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleStockQty = (id, qty) => {
    setSelectedStocks((prev) =>
      prev.map((s) => (s.itemStock.id === id ? { ...s, quantity: qty } : s))
    );
  };

  const handleRemoveStock = (id) => {
    setSelectedStocks((prev) => prev.filter((s) => s.itemStock.id !== id));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" className="pack-modal-container">
      <DialogTitle className="pack-modal-header">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TagIcon color="primary" />
          <Typography variant="h6" fontWeight="800">
            {editingPack ? 'Editar Pack' : 'Nuevo Pack'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} className="close-btn"><CloseIcon /></IconButton>
      </DialogTitle>

<DialogContent dividers className="pack-modal-body">
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Box className="form-sticky-panel">
              <Typography variant="overline" color="primary" fontWeight="700">Ajustes Generales</Typography>
              <TextField label="Nombre del Pack" fullWidth margin="dense" variant="filled" 
                value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
              
              <TextField label="Descripción" fullWidth multiline rows={2} margin="dense" variant="filled"
                value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
              
              <TextField label="Descuento Global" type="number" fullWidth margin="dense" variant="filled"
                value={form.discount} onChange={(e) => setForm({...form, discount: e.target.value})}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />

              <Paper className="price-summary-card" elevation={0}>
                <Box className="summary-row">
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2">${subtotal.toLocaleString()}</Typography>
                </Box>
                <Box className="summary-row total">
                  <Typography fontWeight="700">Total Pack:</Typography>
                  <Typography className="total-value">${Math.round(total).toLocaleString()}</Typography>
                </Box>
              </Paper>
            </Box>
          </Grid>

          <Grid item xs={12} md={7}>
            <Typography variant="overline" color="primary" fontWeight="700">Productos en el Pack</Typography>
            
            <TextField 
              placeholder="Buscar por polera, sticker, color..."
              fullWidth size="small" sx={{ mb: 2, mt: 1 }}
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ color: 'gray', mr: 1 }} /> }}
            />

            <Box className="available-stocks-grid">
              {filteredAvailableStocks.map((stock) => {
                const isSelected = selectedStocks.some(s => s.itemStock.id === stock.id);
                return (
                  <Chip 
                    key={stock.id}
                    label={`${stock.itemType?.name} ${stock.size || ''}`}
                    onClick={() => handleSelectStock(stock)}
                    icon={isSelected ? <CloseIcon /> : <AddIcon />}
                    color={isSelected ? "primary" : "default"}
                    variant={isSelected ? "filled" : "outlined"}
                    className="stock-chip"
                  />
                );
              })}
            </Box>

            <Box className="selected-items-list">
              {selectedStocks.length === 0 && (
                <Box className="empty-selection">
                  <InventoryIcon sx={{ fontSize: 40, opacity: 0.2 }} />
                  <Typography variant="caption">Selecciona productos arriba para armar el pack</Typography>
                </Box>
              )}
              {selectedStocks.map((s) => (
                <Paper key={s.itemStock.id} className="selected-item-row" elevation={0}>
                  <Box className="item-row-header">
                    <Box>
                      <Typography variant="body2" fontWeight="700">{s.itemStock.itemType.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {s.itemStock.size || 'Talla única'} • {s.itemStock.colorName || 'Color base'}
                      </Typography>
                    </Box>
                    <Box className="item-row-actions">
                      <TextField type="number" label="Cant." size="small" value={s.quantity}
                        onChange={(e) => setSelectedStocks(prev => prev.map(item => item.itemStock.id === s.itemStock.id ? {...item, quantity: e.target.value} : item))}
                        sx={{ width: 65 }} />
                      <IconButton color="error" onClick={() => setSelectedStocks(prev => prev.filter(item => item.itemStock.id !== s.itemStock.id))}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  {s.itemStock.itemType.stampingLevels?.length > 0 && (
                    <FormControl fullWidth size="small" sx={{ mt: 1.5 }}>
                      <InputLabel>Nivel de Estampado</InputLabel>
                      <Select value={s.stampingLevel} label="Nivel de Estampado"
                        onChange={(e) => setSelectedStocks(prev => prev.map(item => item.itemStock.id === s.itemStock.id ? {...item, stampingLevel: e.target.value} : item))} >
                        {s.itemStock.itemType.stampingLevels.map(lvl => (
                          <MenuItem key={lvl.level} value={lvl.level}>
                            {lvl.level} (+${Number(lvl.price).toLocaleString()})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </Paper>
              ))}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions className="pack-modal-footer">
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={creating || editing} className="save-btn">
          {creating || editing ? 'Guardando...' : 'Confirmar Pack'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PackModal;
