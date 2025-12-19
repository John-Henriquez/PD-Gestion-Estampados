import { useMemo } from 'react';
import {
  Box, Typography, Select, MenuItem, TextField, InputLabel, 
  FormControl, Grid, CircularProgress, Paper, IconButton, 
  Avatar, Chip, Tooltip, Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import TuneIcon from '@mui/icons-material/Tune';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import HistoryIcon from '@mui/icons-material/History';

import useInventoryMovements from '../../hooks/inventoryMovement/useInventoryMovements.jsx';
import '../../styles/components/modal.css';
import '../../styles/components/inventoryMovementHistory.css';

const MOVEMENT_CONFIG = {
  entrada: { label: 'Entrada', icon: <ArrowCircleUpIcon />, color: '#2e7d32', bgColor: '#e8f5e9' },
  salida: { label: 'Salida', icon: <ArrowCircleDownIcon />, color: '#d32f2f', bgColor: '#ffebee' },
  ajuste: { label: 'Ajuste', icon: <TuneIcon />, color: '#0288d1', bgColor: '#e1f5fe' },
  modificacion: { label: 'Cambio', icon: <EditIcon />, color: '#ed6c02', bgColor: '#fff3e0' },
};

const InventoryMovementHistory = ({ onClose }) => {
  const { movements, totals, filters, setFilters, loading } = useInventoryMovements();

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

const groupedMovements = useMemo(() => {
    const groups = {};
    movements.forEach((mov) => {
      const dateKey = new Date(mov.createdAt).toLocaleDateString('es-CL', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(mov);
    });
    return groups;
  }, [movements]);

  return (
    <Box className="history-modal-container">
      {/* Header Fijo */}
      <Box className="history-header">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">Historial de Movimientos de Inventario</Typography>
        </Box>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </Box>

      <Box className="modal-content" sx={{ p: 3 }}>
        {/* Filtros */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Paper variant="outlined" className="filter-panel">
              <TextField type="date" name="startDate" label="Desde" value={filters.startDate} onChange={handleChange} size="small" InputLabelProps={{ shrink: true }} />
              <TextField type="date" name="endDate" label="Hasta" value={filters.endDate} onChange={handleChange} size="small" InputLabelProps={{ shrink: true }} />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Tipo de Movimiento</InputLabel>
                <Select name="type" value={filters.type} onChange={handleChange} label="Tipo de Movimiento">
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="entrada">Entradas</MenuItem>
                  <MenuItem value="salida">Salidas</MenuItem>
                  <MenuItem value="ajuste">Ajustes</MenuItem>
                </Select>
              </FormControl>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" className="summary-panel">
              <Typography variant="caption" color="textSecondary" gutterBottom>RESUMEN DEL PERIODO</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                <Box>
                  <Typography variant="h6" color="success.main">{totals.entrada || 0}</Typography>
                  <Typography variant="caption">Entradas</Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography variant="h6" color="error.main">{totals.salida || 0}</Typography>
                  <Typography variant="caption">Salidas</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
          {/* Resumen de Totales */}
          {loading ? (
          <Box className="loading-state">
            <CircularProgress size={40} />
            <Typography color="textSecondary">Cargando registros de auditoría...</Typography>
          </Box>
        ) : Object.keys(groupedMovements).length === 0 ? (
          <Box className="empty-state">
            <Inventory2Icon sx={{ fontSize: 80, color: '#e0e0e0', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">Sin movimientos registrados</Typography>
          </Box>
        ) : (
          <Box className="history-timeline">
            {Object.entries(groupedMovements).map(([dateLabel, groupMovs]) => (
              <Box key={dateLabel} sx={{ mb: 4 }}>
                <Typography variant="overline" className="date-separator">
                  {dateLabel}
                </Typography>

                {groupMovs.map((mov) => {
                  const config = MOVEMENT_CONFIG[mov.type] || MOVEMENT_CONFIG.ajuste;
                  const hasChanges = mov.changes && Object.keys(mov.changes).length > 0;

                  return (
                    <Paper key={mov.id} className="movement-row" sx={{ p: 2, mb: 1.5, position: 'relative', overflow: 'hidden', borderLeft: `5px solid ${config.color}`, '&:hover': { boxShadow: 3 } }}>
                      <Grid container spacing={2} alignItems="center">
                        {/* Icono y Hora */}
                        <Grid item xs={12} sm={2} sx={{ textAlign: 'center' }}>
                          <Avatar sx={{ bgcolor: config.bgColor, color: config.color, mx: 'auto', mb: 0.5 }}>
                            {config.icon}
                          </Avatar>
                          <Typography variant="caption" className="movement-time">
                            {new Date(mov.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Grid>

                        {/* Contenido Principal */}
                        <Grid item xs={12} sm={7}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" className="op-name">
                              {mov.operation?.name || 'Acción del Sistema'}
                            </Typography>
                            <Chip 
                                label={`${mov.snapshotItemName} ${mov.snapshotItemSize ? `(${mov.snapshotItemSize})` : ''}`} 
                                size="small" 
                                className="item-chip"
                            />
                            {mov.snapshotItemColor && (
                                <Tooltip title={`Color: ${mov.snapshotItemColor}`}>
                                    <Box className="color-indicator" sx={{ bgcolor: mov.snapshotItemColor }} />
                                </Tooltip>
                            )}
                          </Box>
                          
                          <Typography variant="body2" className="movement-reason">
                            {mov.reason}
                          </Typography>

                          {/* Visualización de Cambios */}
                          {hasChanges && (
                            <Box className="changes-log">
                              {Object.entries(mov.changes).map(([field, data]) => (
                                <Box key={field} className="change-item">
                                  <strong className="field-name">{field}:</strong> 
                                  <span className="old-val">{data.oldValue ?? 'N/A'}</span>
                                  <span className="arrow">→</span>
                                  <strong className="new-val">{data.newValue}</strong>
                                </Box>
                              ))}
                            </Box>
                          )}
                        </Grid>

                        {/* Cantidad y Usuario */}
                        <Grid item xs={12} sm={3} sx={{ textAlign: 'right' }}>
                          {mov.quantity !== 0 && (
                            <Typography variant="h5" className="movement-qty" sx={{ color: config.color }}>
                              {mov.type === 'salida' ? '-' : '+'}{mov.quantity}
                            </Typography>
                          )}
                          <Box className="user-info">
                            <PersonIcon />
                            <Typography variant="caption">
                              {mov.createdBy?.nombreCompleto || 'Automático'}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  );
                })}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default InventoryMovementHistory;