import { useState, useEffect } from 'react';
import { 
  Box, Button, Typography, CircularProgress, Alert, InputAdornment,
  Card, Select, MenuItem, FormControl, InputLabel, Grid,
} from '@mui/material';
import { Search, Filter, RefreshCcw, Package } from 'lucide-react';
import { getAllOrders } from '../services/order.service';
import OrderItemDisplay from '../components/Order/OrderItemDisplay.jsx';

import './../styles/pages/adminOrders.css';

const STATUS_CONFIG = {
  pendiente_de_pago: { color: '#ffffff', bgColor: 'var(--warning)', label: 'Pendiente' },
  en_proceso: { color: '#ffffff', bgColor: 'var(--info)', label: 'En Proceso' },
  enviado: { color: '#ffffff', bgColor: 'var(--secondary)', label: 'Enviado' },
  completado: { color: '#ffffff', bgColor: 'var(--success)', label: 'Completado' },
  cancelado: { color: '#ffffff', bgColor: 'var(--error)', label: 'Cancelado' },
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
      setError(err.message || 'No se pudieron cargar los pedidos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const filteredOrders = statusFilter
    ? orders.filter((order) => order.status?.name === statusFilter)
    : orders;

  return (
   <Box className="admin-container">
      {/* HEADER TIPO DASHBOARD */}
      <Box className="admin-header">
        <Box>
          <Typography variant="h4" className="admin-title">
            Gestión de Pedidos
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Supervisión y control de pedidos del sistema
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<RefreshCcw size={18} />} 
          onClick={fetchAllOrders}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>
      {/* Panel de Filtros*/}
      <Card className="filters-card">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Filtrar por Estado</InputLabel>
              <Select
                value={statusFilter}
                label="Filtrar por Estado"
                onChange={(e) => setStatusFilter(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <Filter size={18} />
                  </InputAdornment>
                }
              >
                <MenuItem value=""><em>Todos los estados</em></MenuItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: config.bgColor }} />
                      {config.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
            <Typography variant="body2" fontWeight="500" color="var(--gray-600)">
              Mostrando {filteredOrders.length} de {orders.length} pedidos totales
            </Typography>
          </Grid>
        </Grid>
      </Card>

      {/* Estados de Carga y Error */}
      {loading ? (
        <Box className="admin-loading">
          <CircularProgress color="primary" />
          <Typography sx={{ mt: 2 }}>Sincronizando con el servidor...</Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      ) : filteredOrders.length === 0 ? (
        <Box className="admin-empty">
          <Package size={64} color="var(--gray-300)" />
          <Typography variant="h6">No hay pedidos para mostrar</Typography>
          <Typography variant="body2" color="textSecondary">
            Intenta cambiar el filtro o esperar a nuevas compras.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
        {filteredOrders.map((order) => (
          <Grid item xs={12} sm={6} md={4} key={order.id}> 
            <OrderItemDisplay order={order} isAdminView={true} />
          </Grid>
        ))}
      </Grid>
      )}
    </Box>
  );
};

export default AdminOrders;