import { useState, useEffect, useCallback, useRef } from 'react';
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
  Grid,
  Typography,
  CircularProgress,
  IconButton,
  Alert,
} from '@mui/material';
import { Autocomplete } from '@mui/material';
import { UploadCloud as UploadIcon, X as XIcon } from 'lucide-react';
import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';
import { useCreateItemStock } from '../../hooks/itemStock/useCreateItemStock.jsx';
import useEditItemStock from '../../hooks/itemStock/useEditItemStock.jsx';
import { uploadMultipleProductImages } from '../../services/upload.service';
import { COLOR_DICTIONARY } from '../../data/colorDictionary';

import '../../styles/components/modal.css';
import '../../styles/components/addItemStockModal.css';

const DEFAULT_FORM = {
  itemTypeId: '',
  hexColor: '#FFFFFF',
  size: '',
  quantity: '',
  price: '',
  minStock: '',
  productImageUrls: [],
};

const AddItemStockModal = ({ open, onClose, onCreated, itemTypes = [], editingStock = null }) => {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const { addStock: createStock, loading: creating } = useCreateItemStock();
  const { editItemStock: updateStock, loading: updating } = useEditItemStock();
  const loading = creating || updating;

  useEffect(() => {
    if (open) {
      if (editingStock) {
        const matchingType = itemTypes.find((t) => t.id === editingStock.itemTypeId);
        setForm({
          itemTypeId: matchingType ? editingStock.itemTypeId : '',
          hexColor: editingStock.hexColor || '#FFFFFF',
          size: editingStock.size || '',
          quantity: editingStock.quantity?.toString() ?? '',
          price: editingStock.price?.toString() ?? '',
          minStock: editingStock.minStock?.toString() || '',
          productImageUrls: editingStock.productImageUrls || [],
        });
      } else {
        setForm(DEFAULT_FORM);
      }
      setSelectedFiles([]);
      setPreviews([]);
      setUploadError(null);
      setIsUploading(false);
    }
  }, [open, editingStock, itemTypes]);

  useEffect(() => {
    setSelectedType(itemTypes.find((type) => type.id === form.itemTypeId) || null);
  }, [form.itemTypeId, itemTypes]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    setSelectedFiles((prev) => [...prev, ...files]);
    setUploadError(null);

    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreviews((prev) => [...prev, { file, url: reader.result }]);
        reader.readAsDataURL(file);
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeSelectedFile = (fileToRemove) => {
    setSelectedFiles((prev) => prev.filter((file) => file !== fileToRemove));
    setPreviews((prev) => prev.filter((p) => p.file !== fileToRemove));
  };

  const removeExistingUrl = (urlToRemove) => {
    setForm((prev) => ({
      ...prev,
      productImageUrls: prev.productImageUrls.filter((url) => url !== urlToRemove),
    }));
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleImageUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return [];
    setIsUploading(true);
    setUploadError(null);
    try {
      const uploadedUrls = await uploadMultipleProductImages(selectedFiles);
      setIsUploading(false);
      setSelectedFiles([]);
      setPreviews([]);
      showSuccessAlert(
        'Imágenes Subidas',
        `${uploadedUrls.length} imagen(es) subida(s) con éxito.`
      );
      return uploadedUrls || [];
    } catch (err) {
      setIsUploading(false);
      const message = err.message || 'Error al subir imágenes.';
      setUploadError(message);
      showErrorAlert('Error de Subida', message);
      return null;
    }
  }, [selectedFiles]);

  const handleSubmit = async () => {
    let newlyUploadedUrls = [];

    // 1. Subir imágenes nuevas si las hay
    if (selectedFiles.length > 0) {
      const result = await handleImageUpload();
      if (result === null) return;
      newlyUploadedUrls = result;
    }

    // 2. Combinar URLs y preparar payload
    const finalImageUrls = [...form.productImageUrls, ...newlyUploadedUrls];
    const payload = {
      hexColor: form.hexColor,
      quantity: form.quantity ? parseInt(form.quantity, 10) : 0,
      price: form.price ? parseInt(form.price, 10) : 0,
      minStock: form.minStock ? parseInt(form.minStock, 10) : undefined,
      productImageUrls: finalImageUrls,
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
    if (isNaN(payload.price) || payload.price < 0) {
      showErrorAlert('Error', 'Precio inválido.');
      return;
    }
    if (selectedType?.hasSizes && !form.size) {
      showErrorAlert('Error', 'Selecciona una talla.');
      return;
    }

    console.log('🧪 Payload final:', payload);

    // 3. Ejecutar creación o actualización
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

  const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const backendUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
    return `${backendUrl.replace('/api', '')}${url}`;
  };

  const isSaveDisabled =
    loading ||
    isUploading ||
    !form.itemTypeId ||
    !form.hexColor ||
    form.quantity === '' ||
    form.price === '' ||
    (selectedType?.hasSizes && !form.size);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      className="modal add-item-stock-modal"
    >
      <DialogTitle className="modal-title">
        {editingStock ? 'Editar Stock' : 'Nuevo Stock'}
      </DialogTitle>
      <DialogContent dividers className="modal-content">
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
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
              renderOption={(props, option) => (
                <Box component="li" sx={{ '& > div': { mr: 1, flexShrink: 0 } }} {...props}>
                  {' '}
                  <Box
                    sx={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      bgcolor: option.hex,
                      border: '1px solid #ccc',
                    }}
                  />{' '}
                  {option.name}{' '}
                </Box>
              )}
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
              label="Precio *"
              name="price"
              type="number"
              value={form.price}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              InputProps={{ inputProps: { min: 0 } }}
              error={form.price !== '' && parseInt(form.price) < 0}
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
          </Grid>
          <Grid item xs={12} md={6}>
            <Box className="image-upload-section">
              <Typography variant="subtitle1" gutterBottom>
                Imágenes del Producto
              </Typography>
              <input
                type="file"
                multiple
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <Button
                variant="contained"
                onClick={triggerFileInput}
                startIcon={<UploadIcon size={18} />}
                disabled={isUploading}
                fullWidth
                className="image-upload-button"
              >
                {isUploading ? 'Subiendo...' : 'Seleccionar Imágenes...'}
              </Button>
              {isUploading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
                  {' '}
                  <CircularProgress size={20} />{' '}
                  <Typography variant="caption">Subiendo...</Typography>{' '}
                </Box>
              )}
              {uploadError && (
                <Alert severity="error" sx={{ my: 1 }}>
                  {uploadError}
                </Alert>
              )}
              <Box className="image-preview-container">
                {form.productImageUrls.map((url, index) => (
                  <Box key={`existing-${index}-${url}`} className="image-preview-item">
                    <img src={getFullImageUrl(url)} alt={`Imagen ${index + 1}`} />
                    <IconButton
                      size="small"
                      onClick={() => removeExistingUrl(url)}
                      className="image-preview-item__remove-btn"
                      title="Eliminar imagen"
                    >
                      {' '}
                      <XIcon size={14} />{' '}
                    </IconButton>
                  </Box>
                ))}
                {previews.map((preview, index) => (
                  <Box key={`preview-${index}-${preview.file.name}`} className="image-preview-item">
                    <img src={preview.url} alt={`Preview ${index + 1}`} />
                    <IconButton
                      size="small"
                      onClick={() => removeSelectedFile(preview.file)}
                      className="image-preview-item__remove-btn"
                      title="Quitar selección"
                    >
                      {' '}
                      <XIcon size={14} />{' '}
                    </IconButton>
                  </Box>
                ))}
              </Box>
              {form.productImageUrls.length === 0 && previews.length === 0 && (
                <Typography variant="caption" className="no-images-message" color="textSecondary">
                  No hay imágenes asignadas.
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
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
          startIcon={loading || isUploading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading
            ? 'Guardando...'
            : isUploading
              ? 'Subiendo...'
              : editingStock
                ? 'Actualizar Stock'
                : 'Crear Stock'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddItemStockModal;
