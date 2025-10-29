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
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

import { showSuccessAlert, showErrorAlert } from '../helpers/sweetAlert';
import useCreatePack from '../hooks/pack/useCreatePack.jsx';
import useEditPack from '../hooks/pack/useEditPack.jsx';

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

    if (
      selectedStocks.some(
        (s) => !s.quantity || isNaN(Number(s.quantity)) || Number(s.quantity) <= 0
      )
    ) {
      return showErrorAlert('Cantidad inválida', 'Cada ítem debe tener cantidad mayor a 0.');
    }
    console.log('currentUserRut:', currentUserRut);
    if (!currentUserRut) {
      return showErrorAlert('Usuario no identificado', 'No se pudo obtener el usuario actual.');
    }

    const items = selectedStocks.map((s) => ({
      itemStockId: s.itemStock.id,
      quantity: parseInt(s.quantity, 10) || 1,
    }));

    const calculatedPrice = selectedStocks.reduce(
      (sum, s) => sum + Number(s.itemStock.price || 0) * Number(s.quantity || 1),
      0
    );

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

  const total = selectedStocks.reduce(
    (sum, s) => sum + Number(s.itemStock.price || 0) * Number(s.quantity || 1),
    0
  );

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
                  onClick={() => {
                    if (!isSelected) {
                      setSelectedStocks((prev) => [...prev, { itemStock: stock, quantity: '1' }]);
                    }
                  }}
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

          {selectedStocks.map((s) => (
            <Box key={s.itemStock.id} display="flex" alignItems="center" gap={1} mt={1}>
              <Box flexGrow={1} display="flex" alignItems="center" gap={1}>
                <Typography variant="body2">
                  {s.itemStock.itemType.name}
                  {s.itemStock.size ? ` – ${s.itemStock.size}` : ''}
                </Typography>
                {s.itemStock.hexColor && (
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '4px',
                      backgroundColor: s.itemStock.hexColor,
                      border: '1px solid #999',
                    }}
                  />
                )}
              </Box>
              <TextField
                label="Cantidad"
                type="number"
                size="small"
                value={s.quantity}
                onChange={(e) => handleStockQty(s.itemStock.id, e.target.value)}
                style={{ width: 100 }}
                inputProps={{ min: 1 }}
              />
              <IconButton onClick={() => handleRemoveStock(s.itemStock.id)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}

          {selectedStocks.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2">
                Total sin descuento: ${total.toLocaleString()}
              </Typography>
              <Typography variant="subtitle2" color="primary">
                Precio con descuento: $
                {(total * (1 - (Number(form.discount) / 100 || 0))).toFixed(0)}
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
