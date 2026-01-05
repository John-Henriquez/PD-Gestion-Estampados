import { Box, Button, TextField, Typography, Grid, Alert, Autocomplete } from '@mui/material';
import { useStampingLevels } from '../../hooks/itemType/useStampingLevels';

const StampingLevelsForm = ({ levels = [], onChange }) => {
  const { globalLevels } = useStampingLevels();
  const handleAddLevel = () => {
    const newLevels = [
      ...levels,
      {
        level: '',
        description: '',
        price: '0',
        tempId: Date.now() + Math.random(),
      },
    ];
    onChange(newLevels);
  };

  const handleRemoveLevel = (tempId) => {
    const newLevels = levels.filter((l) => l.tempId !== tempId);
    onChange(newLevels);
  };

  const handleChangeLevel = (tempId, field, value) => {
    const newLevels = levels.map((l) => (l.tempId === tempId ? { ...l, [field]: value } : l));
    onChange(newLevels);
  };

  const handleSelectSuggestion = (tempId, newValue) => {
    if (typeof newValue === 'object' && newValue !== null) {
      const newLevels = levels.map((l) => 
        l.tempId === tempId 
          ? { ...l, level: newValue.level, price: newValue.price, description: newValue.description } 
          : l
      );
      onChange(newLevels);
    } else {
      handleChangeLevel(tempId, 'level', newValue || '');
    }
  };

  const hasInvalidPrice = levels.some(
    (l) =>
      l.price === null ||
      l.price === undefined ||
      (typeof l.price === 'string' && l.price.trim() === '') ||
      parseFloat(l.price) < 0 ||
      isNaN(parseFloat(l.price))
  );
  const hasValidationErrors = levels.some(l => !l.level.trim() || isNaN(parseFloat(l.price)) || parseFloat(l.price) < 0);

  return (
    <Box sx={{ mt: 3, p: 2, border: '1px solid var(--gray-300)', borderRadius: '4px', bgcolor: 'var(--gray-200)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'var(--primary-dark)' }}>
          Niveles de Servicio de Estampado
        </Typography>
        <Button onClick={handleAddLevel} size="small" variant="contained" color="success">
          + Agregar Nivel
        </Button>
      </Box>

      {levels.map((level, index) => (
        <Box key={level.tempId} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: '6px', bgcolor: 'white' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={globalLevels}
                getOptionLabel={(option) => option.level || option}
                value={level.level}
                onInputChange={(event, newInputValue) => {
                  handleChangeLevel(level.tempId, 'level', newInputValue);
                }}
                onChange={(event, newValue) => handleSelectSuggestion(level.tempId, newValue)}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Nombre del Nivel" 
                    size="small" 
                    error={!level.level.trim()}
                    helperText={!level.level.trim() ? 'Requerido' : ''}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Precio ($)"
                type="number"
                value={level.price}
                size="small"
                onChange={(e) => handleChangeLevel(level.tempId, 'price', e.target.value)}
                fullWidth
                error={parseFloat(level.price) < 0}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descripción"
                multiline
                rows={1}
                value={level.description}
                size="small"
                onChange={(e) => handleChangeLevel(level.tempId, 'description', e.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>
          <Button onClick={() => handleRemoveLevel(level.tempId)} size="small" color="error" sx={{ mt: 1 }}>
            Eliminar
          </Button>
        </Box>
      ))}
      
      {levels.length === 0 && <Alert severity="error" sx={{ mt: 1 }}>Defina al menos un nivel.</Alert>}
    </Box>
  );
};

export default StampingLevelsForm;
