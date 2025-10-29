import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { getAllOrders } from '../services/order.service';
import OrderItemDisplay from '../components/OrderItemDisplay.jsx';

import './../styles/pages/myOrders.css';

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

  const statusOptions = [
    'pendiente',
    'pagado',
    'procesando',
    'enviado',
    'entregado',
    'cancelado',
    'fallido',
  ];

  return (
    <Box className="myorders-container">
      <Typography variant="h4" component="h1" className="myorders-title">
        Gestionar Pedidos
      </Typography>

      {/* Sección de Filtros */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: 'var(--gray-100)' }}>
        <FormControl fullWidth size="small">
          <InputLabel>Filtrar por Estado</InputLabel>
          <Select
            value={statusFilter}
            label="Filtrar por Estado"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">
              <em>Todos los Estados</em>
            </MenuItem>
            {statusOptions.map((status) => (
              <MenuItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {loading && (
        <Box className="loading-container">
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && filteredOrders.length === 0 && (
        <Typography variant="body1" color="textSecondary" className="empty-message">
          {statusFilter
            ? `No hay pedidos con el estado "${statusFilter}".`
            : 'No hay pedidos registrados.'}
        </Typography>
      )}

      {!loading && !error && filteredOrders.length > 0 && (
        <Box>
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
