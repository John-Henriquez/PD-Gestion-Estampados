import { useMemo } from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  TextField,
  InputLabel,
  FormControl,
  Grid,
  CircularProgress,
  Paper,
  IconButton,
  Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import TuneIcon from '@mui/icons-material/Tune';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import Inventory2Icon from '@mui/icons-material/Inventory2';

import useInventoryMovements from '../../hooks/inventoryMovement/useInventoryMovements.jsx';
import '../../styles/components/modal.css';
import '../../styles/components/inventoryMovementHistory.css';

const MOVEMENT_CONFIG = {
  entrada: {
    label: 'Entrada',
    icon: <ArrowCircleUpIcon />,
    color: 'var(--success)',
    bgColor: '#d4edda',
  },
  salida: {
    label: 'Salida',
    icon: <ArrowCircleDownIcon />,
    color: 'var(--error)',
    bgColor: '#f8d7da',
  },
  ajuste: {
    label: 'Ajuste',
    icon: <TuneIcon />,
    color: 'var(--info)',
    bgColor: '#d1ecf1',
  },
  modificacion: {
    label: 'Modificación',
    icon: <EditIcon />,
    color: 'var(--warning)',
    bgColor: '#fff3cd',
  },
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
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(mov);
    });
    return groups;
  }, [movements]);

  return (
    <Box className="modal">
      <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
        <CloseIcon />
      </IconButton>

      <Typography variant="h5" className="modal-title">
        Historial de Movimientos de Inventario
      </Typography>

      <Box className="modal-content">
        {/* Filtros */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'var(--gray-100)', borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={6} sm={4}>
              <TextField
                type="date"
                name="startDate"
                label="Desde"
                value={filters.startDate}
                onChange={handleChange}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ bgcolor: 'white' }}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField
                type="date"
                name="endDate"
                label="Hasta"
                value={filters.endDate}
                onChange={handleChange}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ bgcolor: 'white' }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small" sx={{ bgcolor: 'white' }}>
                <InputLabel>Tipo</InputLabel>
                <Select name="type" value={filters.type} onChange={handleChange} label="Tipo">
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="entrada">Entrada</MenuItem>
                  <MenuItem value="salida">Salida</MenuItem>
                  <MenuItem value="ajuste">Ajuste</MenuItem>
                  <MenuItem value="modificacion">Modificación</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          {/* Resumen de Totales */}
          {!loading && (
            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap', fontSize: '0.85rem' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'var(--success-dark)' }}>
                <ArrowCircleUpIcon fontSize="small" sx={{ mr: 0.5 }} />
                Entradas: <strong>{totals.entrada || 0}</strong>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'var(--error-dark)' }}>
                <ArrowCircleDownIcon fontSize="small" sx={{ mr: 0.5 }} />
                Salidas: <strong>{totals.salida || 0}</strong>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'var(--info-dark)' }}>
                <TuneIcon fontSize="small" sx={{ mr: 0.5 }} />
                Ajustes: <strong>{totals.ajuste || 0}</strong>
              </Box>
            </Box>
          )}
        </Paper>

        {/* Resultados */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : Object.keys(groupedMovements).length === 0 ? (
          <Box className="empty-state" sx={{ textAlign: 'center', py: 4, opacity: 0.7 }}>
            <Inventory2Icon sx={{ fontSize: 60, color: 'var(--gray-400)', mb: 1 }} />
            <Typography>No se encontraron movimientos en este periodo.</Typography>
          </Box>
        ) : (
          <Box className="movements-timeline">
            {Object.entries(groupedMovements).map(([dateLabel, groupMovs]) => (
              <Box key={dateLabel} sx={{ mb: 3 }}>
                {/* Encabezado de Fecha (STICKY) */}
                <Typography
                  variant="subtitle2"
                  sx={{
                    position: 'sticky',
                    top: 0,
                    bgcolor: 'white',
                    zIndex: 5,
                    py: 1,
                    color: 'var(--gray-600)',
                    textTransform: 'capitalize',
                    borderBottom: '1px solid var(--gray-200)',
                    mb: 1,
                  }}
                >
                  {dateLabel}
                </Typography>

                {groupMovs.map((mov) => {
                  const config = MOVEMENT_CONFIG[mov.type] || MOVEMENT_CONFIG.ajuste;
                  const isZeroQty = mov.quantity === 0;

                  return (
                    <Paper key={mov.id} elevation={0} className="movement-card">
                      {/* 1. Icono Visual */}
                      <Box className="movement-icon-container">
                        <Avatar
                          sx={{
                            bgcolor: config.bgColor,
                            color: config.color,
                            width: 40,
                            height: 40,
                          }}
                        >
                          {config.icon}
                        </Avatar>
                      </Box>

                      {/* 2. Detalles Principales */}
                      <Box className="movement-details">
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography variant="subtitle1" component="div" sx={{ fontWeight: 600 }}>
                            {mov.snapshotItemName || 'Producto eliminado'}
                            {mov.snapshotItemSize && (
                              <Typography
                                component="span"
                                variant="body2"
                                color="textSecondary"
                                sx={{ ml: 1 }}
                              >
                                ({mov.snapshotItemSize})
                              </Typography>
                            )}
                          </Typography>

                          {/* Cantidad grande y visible */}
                          {!isZeroQty && (
                            <Typography
                              variant="h6"
                              sx={{
                                color: config.color,
                                fontWeight: 'bold',
                                minWidth: '60px',
                                textAlign: 'right',
                              }}
                            >
                              {mov.type === 'salida' ? '-' : '+'}
                              {mov.quantity}
                            </Typography>
                          )}
                        </Box>

                        {/* Color e info extra */}
                        {mov.snapshotItemColor && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                bgcolor: mov.snapshotItemColor,
                                borderRadius: '50%',
                                border: '1px solid rgba(0,0,0,0.1)',
                                mr: 1,
                              }}
                            />
                            <Typography variant="caption" color="textSecondary">
                              {mov.snapshotItemColor}
                            </Typography>
                          </Box>
                        )}

                        {/* Motivo */}
                        <Typography variant="body2" sx={{ mt: 1, color: 'var(--gray-800)' }}>
                          {mov.reason || config.label}
                        </Typography>

                        {/* Meta Info (Hora y Usuario) */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 2 }}>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(mov.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon sx={{ fontSize: 14, color: 'var(--gray-500)', mr: 0.5 }} />
                            <Typography variant="caption" color="textSecondary">
                              {mov.createdBy?.nombreCompleto || 'Sistema'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
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
