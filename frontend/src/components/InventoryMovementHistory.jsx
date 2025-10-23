import {
  Box, Typography, Select, MenuItem, TextField,
  InputLabel, FormControl, Grid, CircularProgress, Paper
} from '@mui/material';
import useInventoryMovements from '../hooks/inventoryMovement/useInventoryMovements.jsx';
import '../styles/components/modal.css';

const movementTypeLabels = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste: 'Ajuste',
};


const InventoryMovementHistory = () => {
  const {
    movements,
    totals,
    filters,
    setFilters,
    loading,
  } = useInventoryMovements();

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };
  console.group('InventoryMovementHistory Debug');
  console.log('Movements:', movements);
  console.log('Totals:', totals);
  console.groupEnd();

const getBorderColorByReason = (mov) => {
  const reason = mov.reason?.toLowerCase() || '';

  if ((mov.type === 'salida' || mov.type === 'entrada') && 
      reason.includes('ajuste de cantidad')) {
    return '#2196F3'; 
  }

  if (reason.includes('eliminación permanente')) return '#D32F2F';
  if (reason.includes('desactivación lógica')) return '#FF9800';
  if (reason.includes('reactivación')) return '#4CAF50';
  if (reason.includes('ajuste de cantidad') || reason.includes('stock mínimo')) 
    return '#2196F3';
  if (reason.includes('actualización de precio')) return '#03A9F4';
  if (reason.includes('cambio de color')) return '#BA68C8';
  if (reason.includes('modificación de talla')) return '#9575CD';
  if (reason.includes('actualización de imágenes')) return '#7986CB';
  if (reason.includes('ajuste de stock mínimo')) return '#009688';
  if (reason.includes('cambio de estado activo')) return '#90A4AE';
  if (reason.includes('eliminación masiva')) return '#B71C1C';

  // Tipos básicos de movimiento
  if (mov.type === 'entrada') return '#4CAF50';
  if (mov.type === 'salida') return '#F44336';
  if (mov.type === 'ajuste') return '#2196F3';

  return '#9E9E9E'; // fallback
};


  return (
    <Box className="modal">
      {/*Titulo */}
      <Typography variant="h5" className="modal-title">
        Historial de Movimientos de Inventario
      </Typography>

      {/* Contenedor de contenido */}
      <Box className="modal-content">

        {/* Filtros */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4} className="modal-field">
            <TextField
              type="date"
              name="startDate"
              label="Desde"
              value={filters.startDate}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4} className="modal-field">  
            <TextField
              type="date"
              name="endDate"
              label="Hasta"
              value={filters.endDate}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4} className="modal-field">
            <FormControl fullWidth>
              <InputLabel id="type-label">Tipo de Movimiento</InputLabel>
              <Select
                labelId="type-label"
                name="type"
                value={filters.type}
                onChange={handleChange}
                label="Tipo de Movimiento"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="entrada">Entrada</MenuItem>
                <MenuItem value="salida">Salida</MenuItem>
                <MenuItem value="ajuste">Ajuste</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Resultados */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : movements.length === 0 ? (
          <Typography variant="body1" className="modal-no-types-message">
            No se encontraron movimientos.
          </Typography>
        ) : (
        <Box>
          <Typography variant="subtitle1" sx={{ 
            mb: 1,
            p: 2,
            backgroundColor: 'var(--gray-200)',
            borderRadius: 'var(--border-radius-sm)'
          }}>
            Totales: Entrada: {totals.entrada || 0}, Salida: {totals.salida || 0}, Ajuste: {totals.ajuste || 0}
          </Typography>
          {movements.map((mov) => (
            <Paper
              key={mov.id}
              elevation={0}
              sx={{
                p: 2,
                mb: 1,
                backgroundColor: '#f9f9f9',
                borderLeft: `6px solid ${getBorderColorByReason(mov)}`
              }}
            >
            <Typography variant="subtitle2">
              {new Date(mov.createdAt).toLocaleString()} —{' '}
              {(mov.type === 'ajuste' && mov.quantity === 0 && mov.reason)
                ? mov.reason
                : `${movementTypeLabels[mov.type]} de ${mov.quantity} unidades`}
            </Typography>
              {mov.snapshotItemName && (
                <Typography variant="body2">
                  Producto: <strong>{mov.snapshotItemName}</strong> — {mov.snapshotItemSize || ''}
                  {mov.snapshotItemColor && (
                    <>
                      {' '}
                      — <span style={{
                        display: 'inline-block',
                        width: '14px',
                        height: '14px',
                        backgroundColor: mov.snapshotItemColor,
                        border: '1px solid #ccc',
                        borderRadius: '3px',
                        marginLeft: '4px',
                        verticalAlign: 'middle'
                      }} title={mov.snapshotItemColor} />
                      <span style={{ marginLeft: '4px', fontSize: '0.85em', color: '#555' }}>
                        {mov.snapshotItemColor}
                      </span>
                    </>
                  )}
                </Typography>
              )}
                {mov.reason && (
                  <Typography variant="body2" color="text.secondary">
                    Motivo: {mov.reason}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  Por: {mov.createdBy?.nombreCompleto || 'Desconocido'}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default InventoryMovementHistory;
