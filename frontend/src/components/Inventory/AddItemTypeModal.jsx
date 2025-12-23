import { useState, useEffect, useMemo, useRef, useCallback} from 'react';
import { useCreateItemType } from '../../hooks/itemType/useCreateItemType.jsx';
import { useUpdateItemType } from '../../hooks/itemType/useUpdateItemType.jsx';
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
  Checkbox,
  OutlinedInput,
  Chip,
  Box,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Divider
} from '@mui/material';
import { Autocomplete } from '@mui/material';
import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';
import { uploadMultipleProductImages } from '../../services/upload.service';
import ITEM_TYPE_SUGGESTIONS from '../../data/itemTypeSuggestions';
import { useColors } from '../../hooks/color/useColors.jsx';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

import '../../styles/components/modal.css';
import '../../styles/components/addItemTypeModal.css';

import UploadIcon from '@mui/icons-material/Upload';
import CloseIcon from '@mui/icons-material/Close';

import StampingLevelsForm from './StampingLevelsForm.jsx';

const PRINTING_OPTIONS = ['sublimación', 'DTF', 'vinilo'];
const SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL'];

const AddItemTypeModal = ({ open, onClose, onCreated, editingType }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);
  const { colors: dbColors } = useColors();

  const initialFormState = useMemo(
    () => ({
      name: '',
      description: '',
      category: '',
      printingMethods: [],
      hasSizes: false,
      sizesAvailable: [],
      stampLocations: '',
      stampTypes: '',
      productImageUrls: [],
      initialStock: [],
    }),
    []
  );

  const [form, setForm] = useState(initialFormState);
  const [stampingLevels, setStampingLevels] = useState([]);
  const { addType, loading: creating } = useCreateItemType();
  const { updateType, loading: updating } = useUpdateItemType();
  const loading = creating || updating || isUploading;

  useEffect(() => {
    if (open) {
      if (editingType) {
        setForm({
          name: editingType.name,
          description: editingType.description || '',
          category: editingType.category,
          printingMethods: editingType.printingMethods || [],
          hasSizes: editingType.hasSizes,
          sizesAvailable: editingType.sizesAvailable || [],
          productImageUrls: editingType.productImageUrls || [],
        });

        const initialLevels = (editingType.stampingLevels || []).map((level) => ({
          level: level.level || level.name,
          price: level.price || level.absolutePrice,
          description: level.description || '',
          tempId: level.level + Math.random(),
        }));
        setStampingLevels(initialLevels);
      } else {
        setForm(initialFormState);
        setStampingLevels([]);
      }
      setSelectedFiles([]);
      setPreviews([]);
      setUploadError(null);
      setIsUploading(false);
    }
  }, [open, editingType, initialFormState]);

  useEffect(() => {
    if (!editingType) {
      if (form.category === 'clothing') {
        setForm((prev) => ({ ...prev, hasSizes: true }));
      } else if (form.category === 'object') {
        setForm((prev) => ({ ...prev, hasSizes: false, sizesAvailable: [] }));
      }
    }
  }, [form.category, editingType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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

  const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const backendUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
    return `${backendUrl.replace('/api', '')}${url}`;
  };

  const addStockRow = () => {
    setForm(prev => ({
      ...prev,
      initialStock: [...prev.initialStock, { colorId: '', size: '', quantity: 0, minStock: 5 }]
    }));
  };

  const removeStockRow = (index) => {
    setForm(prev => ({
      ...prev,
      initialStock: prev.initialStock.filter((_, i) => i !== index)
    }));
  };

  const updateStockRow = (index, field, value) => {
    const newStock = [...form.initialStock];
    newStock[index][field] = value;
    setForm(prev => ({ ...prev, initialStock: newStock }));
  };

  const handleSubmit = async () => {
    
    if (!stampingLevels || stampingLevels.length === 0) {
      showErrorAlert('Campos Incompletos', 'Debe definir al menos un Nivel de Precio.');
      return;
    }
    const hasInvalidLevel = stampingLevels.some(
      (l) => !l.level?.trim() || l.price === '' || l.price < 0 || isNaN(parseFloat(l.price))
    );
    if (hasInvalidLevel) {
      showErrorAlert(
        'Campos Inválidos',
        'Asegúrese de que todos los niveles tienen nombre y un precio válido (no negativo).'
      );
      return;
    }

    // 1. Subir imágenes nuevas
    let newlyUploadedUrls = [];
    if (selectedFiles.length > 0) {
      const result = await handleImageUpload();
      if (result === null) return;
      newlyUploadedUrls = result;
    }

    const finalImageUrls = [...form.productImageUrls, ...newlyUploadedUrls];

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('hasSizes', form.hasSizes.toString());
      formData.append('printingMethods', JSON.stringify(form.printingMethods));

      if (!editingType && form.initialStock.length > 0) {
        formData.append('initialStock', JSON.stringify(form.initialStock));
      }

      finalImageUrls.forEach((url) => {
        formData.append('productImageUrls[]', url);
      });

      if (form.hasSizes) {
        formData.append('sizesAvailable', JSON.stringify(form.sizesAvailable));
      }

      const cleanedLevels = stampingLevels.map(({ level, price, description }) => ({
        level: level.trim(),
        price: parseFloat(price),
        description: description || '',
      }));
      formData.append('stampingLevels', JSON.stringify(cleanedLevels));

      if (editingType) {
        await updateType(editingType.id, formData);
        showSuccessAlert('¡Tipo actualizado!', 'El tipo de ítem se actualizó correctamente.');
      } else {
        await addType(formData);
        showSuccessAlert('¡Tipo creado!', 'El tipo de ítem se agregó correctamente.');
      }

      if (onCreated) await onCreated();
      
      onClose();
    } catch (error) {
      console.error(error);
      showErrorAlert('Error', error?.message || 'No se pudo completar la operación.');
    }
  };

  const isSaveDisabled =
    loading ||
    !form.name ||
    !form.category ||
    !form.printingMethods.length ||
    stampingLevels.length === 0 ||
    stampingLevels.some((l) => !l.level?.trim() || l.price < 0 || isNaN(l.price));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" className="modal">
      {/* Titulo y Boton de Cerrar */}
      <DialogTitle className="modal-title">
        {editingType ? 'Editar Tipo de Ítem' : 'Nuevo Tipo de Ítem'}
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
      {/* Contenido */}
      <DialogContent dividers className="modal-content">
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Autocomplete
              freeSolo
              options={ITEM_TYPE_SUGGESTIONS}
              value={form.name}
              onInputChange={(e, newValue) => {
                setForm((prev) => ({ ...prev, name: newValue }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Nombre"
                  required
                  fullWidth
                  margin="normal"
                  className="modal-field"
                />
              )}
            />

            <TextField
              label="Descripción"
              name="description"
              value={form.description}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
              margin="normal"
              className="modal-field"
            />
            <FormControl fullWidth required margin="normal" className="modal-field">
              <InputLabel>Categoría</InputLabel>
              <Select
                name="category"
                value={form.category}
                onChange={handleChange}
                disabled={!!editingType}
              >
                <MenuItem value="clothing">Ropa</MenuItem>
                <MenuItem value="object">Objeto</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth required margin="normal" className="modal-field">
              <InputLabel>Métodos de Impresión</InputLabel>
              <Select
                multiple
                name="printingMethods"
                value={form.printingMethods}
                onChange={handleMultiSelectChange}
                input={<OutlinedInput label="Métodos de Impresión" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {PRINTING_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    <Checkbox checked={form.printingMethods.includes(option)} />
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {form.hasSizes && (
              <FormControl fullWidth required margin="normal" className="modal-field">
                <InputLabel>Tallas disponibles</InputLabel>
                <Select
                  multiple
                  name="sizesAvailable"
                  value={form.sizesAvailable}
                  onChange={handleMultiSelectChange}
                  input={<OutlinedInput label="Tallas disponibles" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                >
                  {SIZE_OPTIONS.map((size) => (
                    <MenuItem key={size} value={size}>
                      <Checkbox checked={form.sizesAvailable.includes(size)} />
                      {size}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {!editingType && (
              <Box sx={{ mt: 3, p: 2, border: '1px dashed #bbb', borderRadius: 2, bgcolor: '#fdfdfd' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                  Carga Masiva de Stock Inicial
                </Typography>
                <Typography variant="caption" display="block" sx={{ mb: 2, color: 'text.secondary' }}>
                  Define las variaciones (color/talla) que vas a ingresar ahora mismo.
                </Typography>

                {(form.initialStock || []).map((row, index) => (
                  <Grid container spacing={1} key={index} alignItems="center" sx={{ mb: 1.5 }}>
                    <Grid item xs={5}>
                      <Autocomplete
                        size="small"
                        options={dbColors || []}
                        getOptionLabel={(option) => option.name || ''}
                        onChange={(_, val) => updateStockRow(index, 'colorId', val?.id)}
                        renderInput={(params) => <TextField {...params} label="Color" required />}
                      />
                    </Grid>
                    
                    {form.hasSizes && (
                      <Grid item xs={3}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Talla</InputLabel>
                          <Select
                            value={row.size}
                            label="Talla"
                            onChange={(e) => updateStockRow(index, 'size', e.target.value)}
                          >
                            {/* Solo mostramos las tallas que el usuario seleccionó arriba */}
                            {form.sizesAvailable.length > 0 ? (
                                form.sizesAvailable.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)
                            ) : (
                                <MenuItem disabled>Define tallas arriba</MenuItem>
                            )}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}

                    <Grid item xs={2}>
                      <TextField
                        size="small"
                        type="number"
                        label="Cant."
                        value={row.quantity}
                        onChange={(e) => updateStockRow(index, 'quantity', e.target.value)}
                        InputProps={{ inputProps: { min: 0 } }}
                      />
                    </Grid>

                    <Grid item xs={2}>
                      <IconButton color="error" onClick={() => removeStockRow(index)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}

                <Button 
                  startIcon={<AddIcon />} 
                  onClick={addStockRow} 
                  variant="outlined" 
                  size="small" 
                  sx={{ mt: 1 }}
                >
                  Agregar Variación
                </Button>
              </Box>
            )}
            <Divider sx={{ my: 3 }} />
            <StampingLevelsForm levels={stampingLevels} onChange={setStampingLevels} />
          </Grid>
          <Grid item xs={12} md={6}>
            {/* Sección de Imágenes */}
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
                  <CircularProgress size={20} />
                  <Typography variant="caption">Subiendo...</Typography>
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
                      <CloseIcon size={14} />
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
                      <CloseIcon size={14} />
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
      {/* Botones de Accion */}
      <DialogActions className="modal-actions">
        <Button onClick={onClose} className="modal-button modal-button--cancel">
          Cancelar
        </Button>

        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSaveDisabled}
          className="modal-button modal-button--primary"
        >
          {loading
            ? editingType
              ? 'Actualizando...'
              : 'Creando...'
            : editingType
              ? 'Actualizar'
              : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddItemTypeModal;
