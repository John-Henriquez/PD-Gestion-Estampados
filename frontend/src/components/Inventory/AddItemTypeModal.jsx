import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useCreateItemType } from '../../hooks/itemType/useCreateItemType.jsx';
import { useUpdateItemType } from '../../hooks/itemType/useUpdateItemType.jsx';
import {
  Shirt,
  Coffee,
  GlassWater,
  Key,
  Table,
  Notebook,
  Gift,
  GraduationCap,
  Baby,
  Backpack,
  Smartphone,
  FlaskConical,
  UploadCloud as UploadIcon,
  X as XIcon,
} from 'lucide-react';
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
  ListSubheader,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Autocomplete } from '@mui/material';
import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';
import { uploadMultipleProductImages } from '../../services/upload.service';
import ITEM_TYPE_SUGGESTIONS from '../../data/itemTypeSuggestions';
import '../../styles/components/modal.css';
import '../../styles/components/addItemTypeModal.css';

const PRINTING_OPTIONS = ['sublimación', 'DTF', 'vinilo'];
const SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL'];

const StampingLevelsForm = ({ initialLevels, onChange }) => {
  const [levels, setLevels] = useState(
    (initialLevels || []).map((l) => ({
      level: l.level,
      price: l.price,
      description: l.description || '',
      tempId: l.tempId || Date.now() + Math.random(),
    }))
  );

  useEffect(() => {
    const cleanedLevels = levels.map((l) => ({
      level: l.level?.trim() || 'Nivel',
      price: l.price || 0,
      description: l.description || '',
    }));
    onChange(cleanedLevels);
  }, [levels, onChange]);

  useEffect(() => {
    if (initialLevels && initialLevels.length > 0) {
      setLevels(
        initialLevels.map((l) => ({
          level: l.level || '',
          price: l.price || 0,
          description: l.description || '',
          tempId: l.tempId || Date.now() + Math.random(),
        }))
      );
    }
  }, [initialLevels]);

  const handleAddLevel = () => {
    setLevels([
      ...levels,
      {
        level: '',
        description: '',
        price: 0,
        tempId: Date.now() + Math.random(),
      },
    ]);
  };

  const handleRemoveLevel = (tempId) => {
    setLevels(levels.filter((level) => level.tempId !== tempId));
  };

  const handleChangeLevel = (tempId, field, value) => {
    setLevels(
      levels.map((level) => (level.tempId === tempId ? { ...level, [field]: value } : level))
    );
  };

  const hasInvalidPrice = levels.some((l) => l.price < 0 || l.price === null || isNaN(l.price));
  const hasEmptyLevelName = levels.some((l) => !l.level.trim());
  const hasValidationErrors = hasInvalidPrice || hasEmptyLevelName;

  return (
    <Box
      sx={{
        mt: 3,
        p: 2,
        border: hasValidationErrors ? '1px solid var(--error-dark)' : '1px solid var(--gray-300)',
        borderRadius: '4px',
        bgcolor: 'var(--gray-200)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'var(--primary-dark)' }}>
          Niveles de Servicio de Estampado
        </Typography>
        <Button
          type="button"
          onClick={handleAddLevel}
          size="small"
          variant="contained"
          sx={{ bgcolor: 'var(--success)', '&:hover': { bgcolor: 'var(--success-dark)' } }}
        >
          + Agregar Nivel
        </Button>
      </Box>
      {levels.map((level, index) => (
        <Box
          key={level.tempId}
          sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: '6px', bgcolor: 'white' }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Nivel #{index + 1} ({level.level || 'Sin Nombre'})
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre del Nivel"
                value={level.level}
                size="small"
                onChange={(e) => handleChangeLevel(level.tempId, 'level', e.target.value)}
                fullWidth
                error={!level.level.trim()}
                helperText={!level.level.trim() ? 'El nombre del nivel es obligatorio.' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Precio Total Absoluto ($)"
                type="number"
                value={level.price}
                size="small"
                onChange={(e) =>
                  handleChangeLevel(level.tempId, 'price', parseFloat(e.target.value) || 0)
                }
                fullWidth
                inputProps={{ min: 0.01, step: 0.01 }}
                error={level.price < 0 || isNaN(level.price)}
                helperText={level.price < 0 ? 'El precio debe ser no negativo.' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descripción para el Cliente"
                multiline
                rows={1}
                value={level.description}
                size="small"
                onChange={(e) => handleChangeLevel(level.tempId, 'description', e.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>

          <Button
            type="button"
            onClick={() => handleRemoveLevel(level.tempId)}
            size="small"
            color="error"
            sx={{ mt: 1 }}
          >
            Eliminar
          </Button>
        </Box>
      ))}
      {levels.length === 0 && (
        <Alert severity="error" sx={{ mt: 1 }}>
          Debe definir al menos un Nivel de Precio para el producto.
        </Alert>
      )}
      {hasValidationErrors && levels.length > 0 && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          Revise los niveles: los nombres son obligatorios y los precios deben ser no negativos.
        </Alert>
      )}
    </Box>
  );
};

const ICON_CATEGORIES = [
  {
    name: 'Ropa y Textiles',
    icons: [
      { label: 'Camiseta', value: 'shirt', Icon: Shirt },
      { label: 'Gorra', value: 'cap', Icon: GraduationCap },
      { label: 'Pijama', value: 'pijama', Icon: Baby },
      { label: 'Bolso/Mochila', value: 'bag', Icon: Backpack },
    ],
  },
  {
    name: 'Accesorios',
    icons: [
      { label: 'Taza', value: 'mug', Icon: Coffee },
      { label: 'Vaso', value: 'glass', Icon: GlassWater },
      { label: 'Llave', value: 'key', Icon: Key },
    ],
  },
  {
    name: 'Hogar',
    icons: [
      { label: 'Mesa', value: 'table', Icon: Table },
      { label: 'Smartphone', value: 'phone', Icon: Smartphone },
    ],
  },
  {
    name: 'Promocionales/Regalos',
    icons: [
      { label: 'Libreta', value: 'notebook', Icon: Notebook },
      { label: 'Botella', value: 'bottle', Icon: FlaskConical },
      { label: 'Regalo', value: 'gift', Icon: Gift },
    ],
  },
];

const AddItemTypeModal = ({ open, onClose, onCreated, editingType }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const initialFormState = useMemo(
    () => ({
      name: '',
      description: '',
      category: '',
      printingMethods: [],
      hasSizes: false,
      sizesAvailable: [],
      icon: '',
      stampLocations: '',
      stampTypes: '',
      productImageUrls: [],
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
      console.log('Modal abierto. editingType recibido:', editingType);
      if (editingType) {
        setForm({
          name: editingType.name,
          description: editingType.description || '',
          category: editingType.category,
          printingMethods: editingType.printingMethods || [],
          hasSizes: editingType.hasSizes,
          sizesAvailable: editingType.sizesAvailable || [],
          icon: editingType.iconName || '',
          productImageUrls: editingType.productImageUrls || [],
        });

        console.log('📦 editingType.stampingLevels:', editingType.stampingLevels);

        const initialLevels = (editingType.stampingLevels || []).map((level) => ({
          level: level.level || level.name,
          price: level.price || level.absolutePrice,
          description: level.description || '',
          tempId: level.level + Math.random(),
        }));
        console.log('✅ initialLevels procesados para setStampingLevels:', initialLevels);
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

  const handleSubmit = async () => {
    if (stampingLevels.length === 0) {
      showErrorAlert('Campos Incompletos', 'Debe definir al menos un Nivel de Precio.');
      return;
    }
    const hasInvalidLevel = stampingLevels.some(
      (l) => !l.level?.trim() || l.price < 0 || isNaN(l.price)
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

    // 2. Combinar URLs y preparar FormData
    const finalImageUrls = [...form.productImageUrls, ...newlyUploadedUrls];

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('hasSizes', form.hasSizes.toString());
      formData.append('printingMethods', JSON.stringify(form.printingMethods));
      finalImageUrls.forEach((url) => {
        formData.append('productImageUrls[]', url);
      });

      if (form.hasSizes) {
        formData.append('sizesAvailable', JSON.stringify(form.sizesAvailable));
      }

      if (form.icon) {
        formData.append('iconName', form.icon);
      }

      const cleanedLevels = stampingLevels.map(({ level, price, description }) => ({
        level: level,
        price: price,
        description: description,
      }));
      formData.append('stampingLevels', JSON.stringify(cleanedLevels));

      console.log('Datos enviados al backend:');
      for (let pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }

      if (editingType) {
        await updateType(editingType.id, formData);
        showSuccessAlert('¡Tipo actualizado!', 'El tipo de ítem se actualizó correctamente.');
      } else {
        await addType(formData);
        showSuccessAlert('¡Tipo creado!', 'El tipo de ítem se agregó correctamente.');
      }

      onCreated();
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
      <DialogTitle className="modal-title">
        {editingType ? 'Editar Tipo de Ítem' : 'Nuevo Tipo de Ítem'}
      </DialogTitle>
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
            <FormControl fullWidth margin="normal" className="modal-field">
              <InputLabel>Ícono</InputLabel>
              <Select
                name="icon"
                value={form.icon}
                onChange={handleChange}
                renderValue={(value) => {
                  let selectedIcon;
                  for (const category of ICON_CATEGORIES || []) {
                    selectedIcon = category?.icons?.find((i) => i.value === value);
                    if (selectedIcon) break;
                  }
                  return selectedIcon ? (
                    <Box display="flex" alignItems="center" gap={1}>
                      <selectedIcon.Icon size={20} />
                      {selectedIcon.label}
                    </Box>
                  ) : (
                    'Sin ícono'
                  );
                }}
              >
                {ICON_CATEGORIES.map((category) => (
                  <React.Fragment key={category.name}>
                    <ListSubheader>{category.name}</ListSubheader>
                    {(category.icons || []).map((icon) => (
                      <MenuItem key={icon.value} value={icon.value}>
                        <icon.Icon size={24} style={{ marginRight: 8 }} />
                        {icon.label}
                      </MenuItem>
                    ))}
                  </React.Fragment>
                ))}
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
                      <XIcon size={14} />
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
                      <XIcon size={14} />
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
            {/* Sección de Precios */}
            <StampingLevelsForm
              key={editingType ? `${editingType.id}-${stampingLevels.length}` : 'new'}
              initialLevels={stampingLevels}
              onChange={setStampingLevels}
            />
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
