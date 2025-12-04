import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, Grid } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { getMyOrders } from '../services/order.service';
import OrderItemDisplay from '../components/Order/OrderItemDisplay.jsx';
import './../styles/pages/myOrders.css';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedOrders = await getMyOrders();
        setOrders(fetchedOrders || []);
      } catch (err) {
        console.error('Error al obtener mis pedidos:', err);
        setError(err.message || 'No se pudieron cargar tus pedidos.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <Box className="myorders-container">
      <Typography variant="h4" component="h1" className="myorders-title">
        Mis Pedidos
      </Typography>

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

      {!loading && !error && orders.length === 0 && (
        <Typography variant="body1" color="textSecondary" className="empty-message">
          Aún no tienes pedidos registrados. ¿Qué tal si exploras{' '}
          <RouterLink to="/shop">nuestra tienda</RouterLink>?
        </Typography>
      )}

      {!loading && !error && orders.length > 0 && (
        <Grid container spacing={3}>
          {orders.map((order) => (
            <Grid item xs={12} sm={6} md={4} key={order.id}>
              <OrderItemDisplay order={order} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default MyOrders;
