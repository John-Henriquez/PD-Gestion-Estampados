import { Box, Button, TextField, Typography, Grid, Alert } from '@mui/material';

const StampingLevelsForm = ({ levels = [], onChange }) => {
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

  const hasInvalidPrice = levels.some(
    (l) =>
      l.price === null ||
      l.price === undefined ||
      (typeof l.price === 'string' && l.price.trim() === '') ||
      parseFloat(l.price) < 0 ||
      isNaN(parseFloat(l.price))
  );
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
          Revise los niveles: los nombres son obligatorios y los precios deben ser positivos.
        </Alert>
      )}
    </Box>
  );
};

export default StampingLevelsForm;
