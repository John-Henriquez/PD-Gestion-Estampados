import { useState, useEffect } from 'react';
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
} from '@mui/material';
import { Autocomplete } from '@mui/material';
import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';
import ITEM_TYPE_SUGGESTIONS from '../../data/itemTypeSuggestions';
import '../../styles/components/modal.css';

const PRINTING_OPTIONS = ['sublimación', 'DTF', 'vinilo'];
const SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL'];

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

const initialFormState = {
  name: '',
  description: '',
  category: '',
  printingMethods: [],
  hasSizes: false,
  sizesAvailable: [],
  icon: '',
};

const AddItemTypeModal = ({ open, onClose, onCreated, editingType }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    printingMethods: [],
    hasSizes: false,
    sizesAvailable: [],
    icon: '',
  });

  const { addType, loading: creating } = useCreateItemType();
  const { updateType, loading: updating } = useUpdateItemType();
  const loading = creating || updating;

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
          icon: editingType.iconKey || '',
        });
      } else {
        setForm(initialFormState);
      }
    }
  }, [open, editingType]);

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

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('hasSizes', form.hasSizes.toString());
      formData.append('printingMethods', JSON.stringify(form.printingMethods));

      if (form.hasSizes) {
        formData.append('sizesAvailable', JSON.stringify(form.sizesAvailable));
      }

      if (form.icon) {
        formData.append('iconName', form.icon);
      }

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

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" className="modal">
      <DialogTitle className="modal-title">
        {editingType ? 'Editar Tipo de Ítem' : 'Nuevo Tipo de Ítem'}
      </DialogTitle>
      <DialogContent dividers className="modal-content">
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
              for (const category of ICON_CATEGORIES) {
                selectedIcon = category.icons.find((i) => i.value === value);
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
            {ICON_CATEGORIES.map((category) => [
              <ListSubheader key={category.name}>{category.name}</ListSubheader>,
              ...category.icons.map((icon) => (
                <MenuItem key={icon.value} value={icon.value}>
                  <icon.Icon size={24} style={{ marginRight: 8 }} />
                  {icon.label}
                </MenuItem>
              )),
            ])}
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
      </DialogContent>

      <DialogActions className="modal-actions">
        <Button onClick={onClose} className="modal-button modal-button--cancel">
          Cancelar
        </Button>

        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !form.name || !form.category || !form.printingMethods.length}
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
