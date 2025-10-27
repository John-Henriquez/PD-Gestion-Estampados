import {
  Box, Typography, Select, MenuItem, TextField,
  InputLabel, FormControl, Grid, CircularProgress, Paper
} from '@mui/material';
import useInventoryMovements from '../hooks/inventoryMovement/useInventoryMovements.jsx';
import '../styles/components/modal.css';
import '../styles/components/inventoryMovementHistory.css';

const movementTypeLabels = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste: 'Ajuste',
  modificacion: 'Modificación'
};

const getMovementClasses = (mov) => {
    const classes = ['movement-item'];
    const type = mov.type || 'ajuste'; 
    const operation = mov.operation || 'unspecified';


    classes.push(`movement-type-${type}`);

    classes.push(`movement-op-${operation}`);

    return classes.join(' ');
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

  return (
    <Box className="modal">
      <Typography variant="h5" className="modal-title">
        Historial de Movimientos de Inventario
      </Typography>

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
                <MenuItem value="modificacion">Modificación</MenuItem>
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
          <Typography variant="subtitle1" sx={{ mb: 1,p: 2,backgroundColor: 'var(--gray-200)',borderRadius: 'var(--border-radius-sm)'
          }}>
            Totales: Entrada: {totals.entrada || 0}, Salida: {totals.salida || 0}, Ajuste: {totals.ajuste || 0}
          </Typography>
          {movements.map((mov) => (
            <Paper
              key={mov.id}
              elevation={0}
              className={getMovementClasses(mov)}
            >
            <Typography variant="subtitle2">
              {new Date(mov.createdAt).toLocaleString()} —{' '}
              {(mov.type === 'ajuste' && mov.quantity === 0 && mov.reason)
                ? mov.reason
                : `${movementTypeLabels[mov.type]} de ${mov.quantity} unidades`}
            </Typography>
              {mov.snapshotItemName && (
                <Typography variant="body2">
                  Producto: <strong>{mov.snapshotItemName}</strong> {mov.snapshotItemSize ? ` — ${mov.snapshotItemSize}` : ''}
                  {mov.snapshotItemColor && (
                    <>
                      {' '}— <span
                            className="movement-snapshot-color" 
                            style={{ backgroundColor: mov.snapshotItemColor }}
                            title={mov.snapshotItemColor}
                           />

                      <span className="movement-snapshot-hex"> 
                        {mov.snapshotItemColor}
                      </span>
                    </>
                  )}
                </Typography>
              )}
                {(mov.reason && !(mov.type === 'ajuste' && mov.quantity === 0 && mov.reason && !mov.reason.includes('Ajuste de inventario'))) && (
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
