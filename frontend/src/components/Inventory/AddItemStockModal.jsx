import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Box,
  Typography,
  CircularProgress,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Autocomplete } from '@mui/material';
import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';
import { useCreateItemStock } from '../../hooks/itemStock/useCreateItemStock.jsx';
import useEditItemStock from '../../hooks/itemStock/useEditItemStock.jsx';
import { COLOR_DICTIONARY } from '../../data/colorDictionary';

import '../../styles/components/modal.css';

const DEFAULT_FORM = {
  itemTypeId: '',
  hexColor: '#FFFFFF',
  size: '',
  quantity: '',
  minStock: '',
};

const AddItemStockModal = ({ open, onClose, onCreated, itemTypes = [], editingStock = null }) => {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [selectedType, setSelectedType] = useState(null);

  const { addStock: createStock, loading: creating } = useCreateItemStock();
  const { editItemStock: updateStock, loading: updating } = useEditItemStock();
  const loading = creating || updating;

  useEffect(() => {
    if (open) {
      if (editingStock) {
        const safeTypeId = editingStock.itemTypeId || editingStock.itemType?.id || '';
        setForm({
          itemTypeId: safeTypeId,
          hexColor: editingStock.hexColor || '#FFFFFF',
          size: editingStock.size || '',
          quantity: editingStock.quantity?.toString() ?? '',
          minStock: editingStock.minStock?.toString() || '',
        });
      } else {
        setForm(DEFAULT_FORM);
      }
    }
  }, [open, editingStock, itemTypes]);

  useEffect(() => {
    setSelectedType(itemTypes.find((type) => type.id === form.itemTypeId) || null);
  }, [form.itemTypeId, itemTypes]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    const payload = {
      hexColor: form.hexColor,
      quantity: form.quantity ? parseInt(form.quantity, 10) : 0,
      minStock: form.minStock ? parseInt(form.minStock, 10) : undefined,
      ...(selectedType?.hasSizes && form.size && { size: form.size }),
      ...(!editingStock && { itemTypeId: form.itemTypeId }),
    };

    if (!payload.itemTypeId && !editingStock) {
      showErrorAlert('Error', 'Selecciona un tipo de ítem.');
      return;
    }
    if (isNaN(payload.quantity) || payload.quantity < 0) {
      showErrorAlert('Error', 'Cantidad inválida.');
      return;
    }
    if (selectedType?.hasSizes && !form.size) {
      showErrorAlert('Error', 'Selecciona una talla.');
      return;
    }

    console.log('Payload final:', payload);

    try {
      if (editingStock) {
        await updateStock(editingStock.id, payload);
        showSuccessAlert('¡Stock actualizado!');
      } else {
        await createStock(payload);
        showSuccessAlert('¡Stock agregado!');
      }
      onCreated();
      onClose();
    } catch (error) {
      const backendError = error.response?.data || error;
      console.error('Error al guardar stock:', backendError);
      showErrorAlert('Error al Guardar', backendError.message || 'No se pudo guardar.');
    }
  };

  const isSaveDisabled =
    loading ||
    !form.itemTypeId ||
    !form.hexColor ||
    form.quantity === '' ||
    (selectedType?.hasSizes && !form.size);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" className="modal">
      <DialogTitle className="modal-title">
        {editingStock ? 'Editar Stock' : 'Nuevo Stock'}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers className="modal-content">
        <Box sx={{ p: 0 }}>
          <FormControl
            fullWidth
            margin="normal"
            disabled={!!editingStock}
            error={!form.itemTypeId && !editingStock}
          >
            {itemTypes.length > 0 ? (
              <>
                <InputLabel id="item-type-label">Tipo de Ítem *</InputLabel>
                <Select
                  labelId="item-type-label"
                  label="Tipo de Ítem *"
                  name="itemTypeId"
                  value={form.itemTypeId}
                  onChange={(e) =>
                    handleChange({
                      target: { name: 'itemTypeId', value: e.target.value },
                    })
                  }
                  required
                >
                  {itemTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </>
            ) : (
              <Typography className="modal-no-types-message">No hay tipos de ítem.</Typography>
            )}
          </FormControl>
          <Autocomplete
            options={COLOR_DICTIONARY}
            getOptionLabel={(option) => option.name}
            value={COLOR_DICTIONARY.find((c) => c.hex === form.hexColor) || null}
            onChange={(e, newValue) =>
              newValue && setForm((prev) => ({ ...prev, hexColor: newValue.hex }))
            }
            isOptionEqualToValue={(option, value) => option.hex === value?.hex}
            renderInput={(params) => (
              <TextField {...params} label="Color *" fullWidth margin="normal" required />
            )}
            renderOption={(props, option) => {
              const { key, ...rest } = props;
              return (
                <Box
                  key={key}
                  component="li"
                  sx={{ '& > div': { mr: 1, flexShrink: 0 } }}
                  {...rest}
                >
                  <Box
                    sx={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      bgcolor: option.hex,
                      border: '1px solid #ccc',
                    }}
                  />
                  {option.name}
                </Box>
              );
            }}
          />
          {selectedType?.hasSizes && (
            <FormControl fullWidth margin="normal" error={!form.size}>
              <InputLabel id="size-label">Talla *</InputLabel>
              <Select
                labelId="size-label"
                label="Talla *"
                name="size"
                value={form.size}
                onChange={handleChange}
                required
              >
                {(selectedType.sizesAvailable || []).map((size) => (
                  <MenuItem key={size} value={size}>
                    {size}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField
            label="Cantidad *"
            name="quantity"
            type="number"
            value={form.quantity}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            InputProps={{ inputProps: { min: 0 } }}
            error={form.quantity !== '' && parseInt(form.quantity) < 0}
          />
          <TextField
            label="Stock Mínimo"
            name="minStock"
            type="number"
            value={form.minStock}
            onChange={handleChange}
            fullWidth
            margin="normal"
            InputProps={{ inputProps: { min: 0 } }}
            helperText="Dejar vacío para default"
            error={form.minStock !== '' && parseInt(form.minStock) < 0}
          />
        </Box>
      </DialogContent>
      <DialogActions className="modal-actions">
        <Button onClick={onClose} className="modal-button modal-button--cancel">
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSaveDisabled}
          className="modal-button modal-button--primary"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Guardando...' : editingStock ? 'Actualizar Stock' : 'Crear Stock'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddItemStockModal;
