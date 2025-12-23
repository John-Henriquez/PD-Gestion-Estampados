import { useMemo } from 'react';
import {
  Box, Typography, Select, MenuItem, TextField, InputLabel, 
  FormControl, Grid, CircularProgress, Paper, IconButton, 
  Avatar, Chip, Tooltip, Divider, useMediaQuery, useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import TuneIcon from '@mui/icons-material/Tune';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import HistoryIcon from '@mui/icons-material/History';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

import useInventoryMovements from '../../hooks/inventoryMovement/useInventoryMovements.jsx';
import '../../styles/components/inventoryMovementHistory.css';

const MOVEMENT_CONFIG = {
  entrada: { label: 'Entrada', icon: <ArrowCircleUpIcon />, color: '#2e7d32', bgColor: '#e8f5e9' },
  salida: { label: 'Salida', icon: <ArrowCircleDownIcon />, color: '#d32f2f', bgColor: '#ffebee' },
  ajuste: { label: 'Ajuste', icon: <TuneIcon />, color: '#0288d1', bgColor: '#e1f5fe' },
  modificacion: { label: 'Cambio', icon: <EditIcon />, color: '#ed6c02', bgColor: '#fff3e0' },
};

const InventoryMovementHistory = ({ onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
      {/* Header Potenciado */}
      <Box className="history-header">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box className="history-icon-circle">
            <HistoryIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="800">Auditoría de Inventario</Typography>
            <Typography variant="caption" color="textSecondary">Historial completo de movimientos y ajustes</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} className="close-btn-round"><CloseIcon /></IconButton>
      </Box>

      <Box className="history-scroll-area">
        {/* Panel de Control Responsivo */}
        <Grid container spacing={2} sx={{ p: 3, mb: 1 }}>
          <Grid item xs={12} lg={8}>
            <Paper className="control-panel-glass">
              <TextField type="date" name="startDate" label="Desde" value={filters.startDate} onChange={handleChange} size="small" fullWidth={isMobile} InputLabelProps={{ shrink: true }} />
              <TextField type="date" name="endDate" label="Hasta" value={filters.endDate} onChange={handleChange} size="small" fullWidth={isMobile} InputLabelProps={{ shrink: true }} />
              <FormControl size="small" sx={{ minWidth: 180 }} fullWidth={isMobile}>
                <InputLabel>Tipo de Movimiento</InputLabel>
                <Select name="type" value={filters.type} onChange={handleChange} label="Tipo de Movimiento">
                  <MenuItem value="">Todos los registros</MenuItem>
                  <MenuItem value="entrada">Solo Entradas</MenuItem>
                  <MenuItem value="salida">Solo Salidas</MenuItem>
                  <MenuItem value="ajuste">Ajustes Manuales</MenuItem>
                </Select>
              </FormControl>
            </Paper>
          </Grid>
          
          <Grid item xs={12} lg={4}>
            <Paper className="summary-panel-modern">
              <Box className="summary-item">
                <TrendingUpIcon color="success" />
                <Box>
                  <Typography variant="h5" className="stat-value text-success">{totals.entrada || 0}</Typography>
                  <Typography variant="caption">Total Entradas</Typography>
                </Box>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box className="summary-item">
                <TrendingDownIcon color="error" />
                <Box>
                  <Typography variant="h5" className="stat-value text-error">{totals.salida || 0}</Typography>
                  <Typography variant="caption">Total Salidas</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Timeline de Movimientos */}
        <Box sx={{ px: 3, pb: 4 }}>
          {loading ? (
            <Box className="centered-state">
              <CircularProgress size={50} thickness={4} />
              <Typography color="textSecondary" sx={{ mt: 2 }}>Sincronizando registros...</Typography>
            </Box>
          ) : Object.keys(groupedMovements).length === 0 ? (
            <Box className="centered-state">
              <Inventory2Icon sx={{ fontSize: 80, opacity: 0.1, mb: 2 }} />
              <Typography variant="h6" color="textSecondary">Sin actividad en este periodo</Typography>
            </Box>
          ) : (
            Object.entries(groupedMovements).map(([dateLabel, groupMovs]) => (
              <Box key={dateLabel} sx={{ mb: 4 }}>
                <Typography variant="overline" className="history-date-label">
                  {dateLabel}
                </Typography>

                {groupMovs.map((mov) => {
                  const config = MOVEMENT_CONFIG[mov.type] || MOVEMENT_CONFIG.ajuste;
                  const hasChanges = mov.changes && Object.keys(mov.changes).length > 0;

                  return (
                    <Paper key={mov.id} className="history-row" sx={{ borderLeft: `6px solid ${config.color}` }}>
                      <Grid container spacing={2} alignItems="center">
                        {/* Icono y Tiempo */}
                        <Grid item xs={3} sm={1.5} md={1} sx={{ textAlign: 'center' }}>
                          <Avatar className="type-avatar" sx={{ bgcolor: config.bgColor, color: config.color }}>
                            {config.icon}
                          </Avatar>
                          <Typography variant="caption" className="timestamp">
                            {new Date(mov.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Grid>

                        {/* Detalle del Producto y Acción */}
                        <Grid item xs={9} sm={7.5} md={8}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography className="op-tag" variant="subtitle2">
                              {mov.operation?.name || 'Sistema'}
                            </Typography>
                            <Chip 
                              label={mov.snapshotItemName} 
                              size="small" 
                              variant="outlined"
                              className="item-badge"
                            />
                            {mov.snapshotItemSize && <Chip label={mov.snapshotItemSize} size="small" className="size-badge-mini" />}
                            {mov.snapshotItemColor && <Box className="mini-color-indicator" sx={{ bgcolor: mov.snapshotItemColor }} />}
                          </Box>
                          
                          <Typography variant="body2" className="reason-text">
                            {mov.reason}
                          </Typography>

                          {hasChanges && (
                            <Box className="audit-log-box">
                              {Object.entries(mov.changes).map(([field, data]) => (
                                <div key={field} className="log-line">
                                  <span className="field-label">{field}:</span>
                                  <span className="val-old">{data.oldValue ?? 'ø'}</span>
                                  <span className="log-arrow">→</span>
                                  <span className="val-new">{data.newValue}</span>
                                </div>
                              ))}
                            </Box>
                          )}
                        </Grid>

                        {/* Cantidad y Usuario */}
                        <Grid item xs={12} sm={3} md={3} sx={{ textAlign: isMobile ? 'left' : 'right' }}>
                          <Box className="qty-user-area">
                            {mov.quantity !== 0 && (
                              <Typography variant="h5" className="qty-display" sx={{ color: config.color }}>
                                {mov.type === 'salida' ? '−' : '+'}{mov.quantity}
                              </Typography>
                            )}
                            <Box className="executor-box">
                              <PersonIcon />
                              <Typography variant="caption">{mov.createdBy?.nombreCompleto || 'Bot PD'}</Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  );
                })}
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default InventoryMovementHistory;