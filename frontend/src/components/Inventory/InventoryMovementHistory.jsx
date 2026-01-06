import { useMemo } from 'react';
import {
  Box, Typography, Select, MenuItem, TextField, InputLabel, 
  FormControl, Grid, CircularProgress, Paper, IconButton, 
  Avatar, Chip, Divider, useMediaQuery, useTheme
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
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

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

  const formatCLP = (value) => 
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

  const formatPropertyLabel = (key) => {
    const labels = {
      status: 'Estado del Pedido',
      paymentDate: 'Fecha de Pago',
      paymentMethod: 'Método de Pago',
      quantity: 'Cantidad',
      price: 'Precio',
      isActive: 'Vigencia',
      minStock: 'Stock Crítico'
    };
    return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
  };

  const formatAuditValue = (key, value) => {
    if (!value || value === 'ø') return 'ø';
    if (key === 'status') {
      const cleanValue = String(value).replace(/_/g, ' ');
      return cleanValue.charAt(0).toUpperCase() + cleanValue.slice(1);
    }
    if (key.toLowerCase().includes('date') || (typeof value === 'string' && value.includes('T') && value.includes('Z'))) {
      const date = new Date(value);
      if (!isNaN(date)) {
        return date.toLocaleString('es-CL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
    if (typeof value === 'boolean') return value ? 'Activado' : 'Desactivado';
    return String(value);
  };
  
  return (
    <Box className="history-modal-container">
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

                  const isStatusUpdate = mov.operation?.slug === 'update_info' && mov.snapshotItemName?.startsWith('Pedido #');
                  const isSaleExit = mov.operation?.slug === 'sale';

                  return (
                    <Paper key={mov.id} className="history-row" sx={{ 
                      borderLeft: `6px solid ${isStatusUpdate ? '#90a4ae' : config.color}`,
                      backgroundColor: isStatusUpdate ? '#fafafa' : '#fff'
                    }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={3} sm={1.5} md={1} sx={{ textAlign: 'center' }}>
                          <Avatar className="type-avatar" sx={{ 
                            bgcolor: isStatusUpdate ? '#eceff1' : config.bgColor, 
                            color: isStatusUpdate ? '#607d8b' : config.color
                          }}>
                            {isStatusUpdate ? <HistoryIcon /> : (isSaleExit ? <ShoppingCartIcon /> : config.icon)}
                          </Avatar>
                          <Typography variant="caption" className="timestamp">
                            {new Date(mov.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Grid>

                        <Grid item xs={9} sm={7.5} md={8}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography className="op-tag" variant="subtitle2">
                              {isStatusUpdate ? "Actualización de Pedido" : (mov.operation?.name || 'Sistema')}
                            </Typography>
                            {!isStatusUpdate && (
                              <Chip 
                                label={mov.snapshotItemName} 
                                size="small" 
                                variant="outlined"
                                className="item-badge"
                              />
                            )}
                            {mov.snapshotItemSize && <Chip label={mov.snapshotItemSize} size="small" className="size-badge-mini" />}
                            {mov.snapshotItemColor && <Box className="mini-color-indicator" sx={{ bgcolor: mov.snapshotItemColor }} />}
                          </Box>
                          
                          <Typography variant="body2" className="reason-text">
                            {isStatusUpdate ? `Cambios registrados en el ${mov.snapshotItemName}` : mov.reason}
                          </Typography>

                          {hasChanges && (
                            <Box className="audit-log-box" sx={{ mt: 1 }}>
                              {Object.entries(mov.changes).map(([field, data]) => (
                                <div key={field} className="log-line">
                                  <span className="field-label" style={{textTransform: 'capitalize'}}>{formatPropertyLabel(field)}:</span>
                                  <span className="val-old">{formatAuditValue(field, data.oldValue)}</span>
                                  <span className="log-arrow">→</span>
                                  <span className="val-new">{formatAuditValue(field, data.newValue)}</span>
                                </div>
                              ))}
                            </Box>
                          )}

                        {mov.order && !isStatusUpdate && (
                            <Box className="audit-log-box" sx={{ backgroundColor: 'rgba(0,0,0,0.02)', mt: 1 }}>
                              <div className="log-line">
                                <span className="field-label">Pago:</span>
                                <span className="val-new">{mov.order.paymentMethod}</span>
                                <span style={{margin: '0 8px'}}>|</span>
                                <span className="field-label">Total:</span>
                                <span className="val-new">{formatCLP(mov.order.total)}</span>
                              </div>
                            </Box>
                          )}
                        </Grid>

                        <Grid item xs={12} sm={3} md={3} sx={{ textAlign: isMobile ? 'left' : 'right' }}>
                          <Box className="qty-user-area">
                            {!isStatusUpdate && mov.quantity !== 0 && (
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