import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Card,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { getAllOrders } from '../services/order.service';
import OrderItemDisplay from '../components/Order/OrderItemDisplay.jsx';

import './../styles/pages/myOrders.css';

const STATUS_CONFIG = {
  pendiente_de_pago: {
    color: '#212529', // Texto oscuro para contraste
    bgColor: 'var(--warning)',
    label: 'Pendiente de Pago',
  },
  en_proceso: {
    color: '#ffffff',
    bgColor: 'var(--info)',
    label: 'En Proceso',
  },
  enviado: {
    color: '#ffffff',
    bgColor: 'var(--secondary)',
    label: 'Enviado',
  },
  completado: {
    color: '#ffffff',
    bgColor: 'var(--success)',
    label: 'Completado',
  },
  cancelado: {
    color: '#ffffff',
    bgColor: 'var(--error)',
    label: 'Cancelado',
  },
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedOrders = await getAllOrders();
      setOrders(fetchedOrders || []);
    } catch (err) {
      console.error('Error al obtener todos los pedidos (Admin):', err);
      setError(err.message || 'No se pudieron cargar los pedidos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const filteredOrders = statusFilter
    ? orders.filter((order) => order.status === statusFilter)
    : orders;

  const statusOptions = Object.keys(STATUS_CONFIG);

  return (
    <Box className="myorders-container">
      {/* Header Mejorado */}
      <Box className="admin-orders-header">
        <Typography variant="h4" component="h1" className="admin-orders-title">
          Gestión de Pedidos
        </Typography>
      </Box>

      {/* Panel de Filtros Mejorado */}
      <Card className="filters-panel" elevation={1}>
        <Box className="filters-header">
          <Typography variant="h6" className="filters-title">
            Filtros y Búsqueda
          </Typography>
        </Box>
        <Box className="filters-content">
          <FormControl fullWidth size="small" className="filter-select">
            <InputLabel>Estado del Pedido</InputLabel>
            <Select
              value={statusFilter}
              label="Estado del Pedido"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">
                <em>Todos los estados</em>
              </MenuItem>
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={STATUS_CONFIG[status].label}
                      size="small"
                      sx={{
                        backgroundColor: STATUS_CONFIG[status].bgColor,
                        color: STATUS_CONFIG[status].color,
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Contador de resultados */}
          <Box className="results-count">
            <Typography variant="body2" color="textSecondary">
              {filteredOrders.length} de {orders.length} pedidos
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* Estados de Carga y Error */}
      {loading && (
        <Box className="loading-container">
          <CircularProgress size={60} thickness={4} className="loading-spinner" />
          <Typography variant="h6" className="loading-text">
            Cargando pedidos...
          </Typography>
        </Box>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          className="error-alert"
          action={
            <Button color="inherit" size="small" onClick={fetchAllOrders}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Lista de Pedidos */}
      {!loading && !error && filteredOrders.length === 0 && (
        <Card className="empty-state">
          <Box className="empty-state-content">
            <Typography variant="h6" className="empty-state-title">
              {statusFilter ? 'No hay pedidos con este estado' : 'No hay pedidos registrados'}
            </Typography>
            <Typography variant="body2" color="textSecondary" className="empty-state-description">
              {statusFilter
                ? `No se encontraron pedidos con estado "${STATUS_CONFIG[statusFilter]?.label}".`
                : 'Cuando los clientes realicen pedidos, aparecerán aquí.'}
            </Typography>
          </Box>
        </Card>
      )}

      {/* Lista de Pedidos */}
      {!loading && !error && filteredOrders.length > 0 && (
        <Box className="orders-list">
          {filteredOrders.map((order) => (
            <OrderItemDisplay
              key={order.id}
              order={order}
              isAdminView={true}
              onStatusChange={fetchAllOrders}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default AdminOrders;
