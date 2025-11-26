import { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';
import useCreatePack from '../../hooks/pack/useCreatePack.jsx';
import useEditPack from '../../hooks/pack/useEditPack.jsx';

const DEFAULT_FORM = {
  name: '',
  description: '',
  discount: '',
  isActive: true,
};

const PackModal = ({
  open,
  onClose,
  onCompleted,
  editingPack,
  currentUserRut,
  itemStock,
  refetchStocks,
}) => {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [selectedStocks, setSelectedStocks] = useState([]);

  const availableStocks = useMemo(() => itemStock || [], [itemStock]);

  const { create, loading: creating } = useCreatePack();
  const { edit: editPack, loading: editing } = useEditPack();

  useEffect(() => {
    if (!open) {
      setForm(DEFAULT_FORM);
      setSelectedStocks([]);
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

      console.log(
        `[PackModal] Editando pack "${editingPack.name}" con ${initialStocks.length} ítems`
      );
    } else {
      console.log('[PackModal] Creando nuevo pack - formulario reiniciado');
    }
  }, [open, editingPack]);

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

  const getPriceForItem = (stockData) => {
    const { itemStock, stampingLevel } = stockData;

    if (stampingLevel && itemStock.itemType?.stampingLevels) {
      const levelObj = itemStock.itemType.stampingLevels.find((l) => l.level === stampingLevel);
      if (levelObj && levelObj.price !== undefined) {
        return Number(levelObj.price) || 0;
      }
    }

    return Number(itemStock.price || itemStock.itemType?.basePrice || 0);
  };

  const calculateSubtotal = () => {
    return selectedStocks.reduce((sum, s) => {
      const itemPrice = getPriceForItem(s);
      const quantity = Number(s.quantity || 1);
      return sum + itemPrice * quantity;
    }, 0);
  };

  const calculateTotal = () => {
    const discount = Number(form.discount || 0) / 100;
    return subtotal * (1 - discount);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || selectedStocks.length === 0) {
      return showErrorAlert(
        'Campos incompletos',
        'Debes completar nombre, precio y al menos un ítem.'
      );
    }

    if (Number(form.discount) < 0 || Number(form.discount) < 0) {
      return showErrorAlert('Datos inválidos', 'Precio y descuento deben ser no negativos.');
    }
    const invalidItems = selectedStocks.filter(
      (s) => !s.quantity || isNaN(Number(s.quantity)) || Number(s.quantity) <= 0
    );

    if (invalidItems.length > 0) {
      return showErrorAlert('Cantidad inválida', 'Cada ítem debe tener cantidad mayor a 0.');
    }

    const itemsWithInvalidPrices = selectedStocks.filter(
      (s) => isNaN(getPriceForItem(s)) || getPriceForItem(s) < 0
    );

    if (itemsWithInvalidPrices.length > 0) {
      return showErrorAlert('Precios inválidos', 'Revise los precios de los ítems seleccionados.');
    }

    console.log('currentUserRut:', currentUserRut);
    if (!currentUserRut) {
      return showErrorAlert('Usuario no identificado', 'No se pudo obtener el usuario actual.');
    }

    const items = selectedStocks.map((s) => ({
      itemStockId: s.itemStock.id,
      quantity: parseInt(s.quantity, 10) || 1,
      stampingLevel: s.stampingLevel || null,
    }));

    const calculatedPrice = calculateSubtotal();

    const payload = {
      ...form,
      price: calculatedPrice,
      discount: (Number(form.discount) || 0) / 100,
      isActive: form.isActive,
      items,
      ...(editingPack ? { updatedById: currentUserRut } : { createdById: currentUserRut }),
    };

    try {
      if (editingPack) {
        await editPack(editingPack.id, payload);
        showSuccessAlert('Pack actualizado', 'El pack fue actualizado con éxito');
      } else {
        await create(payload);

        showSuccessAlert('Pack creado', 'El pack fue creado con éxito');
      }
      await refetchStocks();
      onCompleted();
      onClose();
    } catch (e) {
      console.error(e);
      showErrorAlert('Error', e.response?.data?.message || e.message || 'Error inesperado');
    }
  };

  const handleSelectStock = (stock) => {
    const isSelected = selectedStocks.some((s) => s.itemStock.id === stock.id);
    if (!isSelected) {
      const defaultLevel = stock.itemType?.stampingLevels?.[0]?.level || '';
      setSelectedStocks((prev) => [
        ...prev,
        {
          itemStock: stock,
          quantity: '1',
          stampingLevel: defaultLevel,
        },
      ]);
    }
  };

  const subtotal = calculateSubtotal();
  const total = calculateTotal();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{editingPack ? 'Editar Pack' : 'Nuevo Pack'}</DialogTitle>
      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Nombre"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            autoFocus
          />
          <TextField
            label="Descripción"
            name="description"
            value={form.description}
            onChange={handleChange}
            multiline
            minRows={2}
          />
          <Box display="flex" gap={2}>
            <TextField
              label="Descuento (%)"
              name="discount"
              type="number"
              value={form.discount}
              onChange={handleChange}
              inputProps={{ min: 0, max: 100, step: 1 }}
              helperText="Ej: 20 = 20% de descuento"
            />
          </Box>

          <Typography variant="subtitle1" mt={2} mb={1}>
            Selecciona productos:
          </Typography>

          <Box display="flex" flexWrap="wrap" gap={2} maxHeight={300} overflow="auto">
            {availableStocks.map((stock) => {
              const selected = selectedStocks.find((s) => s.itemStock.id === stock.id);
              const isSelected = !!selected;

              return (
                <Box
                  key={stock.id}
                  onClick={() => handleSelectStock(stock)}
                  sx={{
                    border: isSelected ? '2px solid #1976d2' : '1px solid #ccc',
                    padding: 1.5,
                    borderRadius: 2,
                    cursor: isSelected ? 'default' : 'pointer',
                    minWidth: 160,
                    flex: '0 0 auto',
                    backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
                  }}
                >
                  <Typography variant="body2" fontWeight={500}>
                    {stock.itemType?.name || ''}
                    {stock.size ? ` – ${stock.size}` : ''}
                  </Typography>

                  {/* Color swatch */}
                  {stock.hexColor && (
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '4px',
                        backgroundColor: stock.hexColor,
                        border: '1px solid #999',
                        mt: 0.5,
                      }}
                    />
                  )}

                  <Typography variant="caption" color="textSecondary">
                    Precio: ${stock.price?.toFixed(0) || 0}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {selectedStocks.map((s) => {
            // Detectamos si este ítem tiene niveles de estampado configurados
            const hasLevels = s.itemStock.itemType?.stampingLevels?.length > 0;
            // Calculamos precio actual para mostrar
            const currentPrice = getPriceForItem(s);

            return (
              <Box
                key={s.itemStock.id}
                display="flex"
                flexDirection="column" // Cambiamos a columna para tener dos filas
                gap={1}
                mt={2}
                p={1.5}
                border="1px dashed #ccc"
                borderRadius={1}
              >
                {/* FILA 1: Datos del Producto y Cantidad */}
                <Box display="flex" alignItems="center" gap={1}>
                  <Box flexGrow={1}>
                    <Typography variant="body2" fontWeight="bold">
                      {s.itemStock.itemType.name}
                    </Typography>
                    {/* Mostrar talla y color si existen */}
                    <Typography variant="caption" color="textSecondary">
                      {s.itemStock.size ? `Talla: ${s.itemStock.size}` : ''}
                      {s.itemStock.hexColor ? ` - Color: ${s.itemStock.hexColor}` : ''}
                    </Typography>
                  </Box>
                  <TextField
                    label="Cant."
                    type="number"
                    size="small"
                    value={s.quantity}
                    onChange={(e) => handleStockQty(s.itemStock.id, e.target.value)}
                    style={{ width: 80 }}
                    inputProps={{ min: 1 }}
                  />
                  <IconButton onClick={() => handleRemoveStock(s.itemStock.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Box>

                {/* FILA 2: Selector de Nivel de Estampado (NUEVO) */}
                <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                  {hasLevels ? (
                    <FormControl size="small" sx={{ minWidth: 200, flexGrow: 1 }}>
                      <InputLabel>Nivel de Estampado</InputLabel>
                      {/* Este Select actualiza el estado 'stampingLevel' */}
                      <Select
                        value={s.stampingLevel || ''}
                        label="Nivel de Estampado"
                        onChange={(e) => {
                          // Actualizamos manualmente el array de stocks seleccionados
                          setSelectedStocks((prev) =>
                            prev.map((item) =>
                              item.itemStock.id === s.itemStock.id
                                ? { ...item, stampingLevel: e.target.value }
                                : item
                            )
                          );
                        }}
                      >
                        {s.itemStock.itemType.stampingLevels.map((lvl, idx) => (
                          <MenuItem key={idx} value={lvl.level}>
                            {/* Mostramos Nombre y Precio para claridad */}
                            {lvl.level} (${Number(lvl.price).toLocaleString()})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <Typography variant="caption" color="textSecondary">
                      Precio base (sin estampado variable)
                    </Typography>
                  )}

                  {/* Precio calculado de este ítem */}
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    ${(currentPrice * Number(s.quantity || 1)).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            );
          })}

          {selectedStocks.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2"> Subtotal: ${total.toLocaleString()} </Typography>
              <Typography variant="subtitle2" color="primary">
                Precio Pack: ${(total * (1 - (Number(form.discount) / 100 || 0))).toFixed(0)}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={creating || editing}>
          {creating || editing ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PackModal;
