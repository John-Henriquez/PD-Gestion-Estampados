import { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Grid, Alert } from '@mui/material';

const StampingLevelsForm = ({ initialLevels = [], onChange }) => {
  const [levels, setLevels] = useState(() =>
    (initialLevels || []).map((l) => ({
      level: l.level?.toString() || '',
      price: l.price?.toString() || '0',
      description: l.description?.toString() || '',
      tempId: l.tempId || Date.now() + Math.random(),
    }))
  );

  useEffect(() => {
    if (initialLevels.length === 0) return;

    setLevels((prev) => {
      const same =
        prev.length === initialLevels.length &&
        prev.every(
          (p, i) =>
            p.level === initialLevels[i].level &&
            parseFloat(p.price) === parseFloat(initialLevels[i].price) &&
            p.description === initialLevels[i].description
        );

      if (same) return prev;

      return initialLevels.map((l) => ({
        level: l.level?.toString() || '',
        price: l.price?.toString() || '0',
        description: l.description?.toString() || '',
        tempId: l.tempId || Date.now() + Math.random(),
      }));
    });
  }, [initialLevels]);

  useEffect(() => {
    const cleanedLevels = levels.map((l) => ({
      level: l.level?.trim() || 'Nivel',
      price: parseFloat(l.price) || 0,
      description: l.description || '',
    }));
    onChange(cleanedLevels);
  }, [levels, onChange]);

  const handleAddLevel = () => {
    setLevels((prev) => [
      ...prev,
      {
        level: '',
        description: '',
        price: 0,
        tempId: Date.now() + Math.random(),
      },
    ]);
  };

  const handleRemoveLevel = (tempId) => {
    setLevels((prev) => prev.filter((l) => l.tempId !== tempId));
  };

  const handleChangeLevel = (tempId, field, value) => {
    setLevels((prev) => prev.map((l) => (l.tempId === tempId ? { ...l, [field]: value } : l)));
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

export default StampingLevelsForm;
