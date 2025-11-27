import { Box, Typography, Paper, Divider, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { format as formatTempo } from '@formkit/tempo';

import '../../styles/components/orderItemDisplay.css';

const formatStatus = (status) => {
  const statusMap = {
    pendiente: 'Pendiente',
    confirmado: 'Confirmado',
    en_preparacion: 'En Preparación',
    listo_para_entrega: 'Listo para Entrega',
    en_camino: 'En Camino',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
    rechazado: 'Rechazado',
  };
  return statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const OrderItemDisplay = ({ order, isAdminView = false }) => {
  const statusClassName = `status-${order.status || 'default'}`;
  const chipClassName = `chip-${order.status || 'default'}`;

  return (
    <Paper elevation={1} className={`order-item-paper ${statusClassName}`}>
      <Box className="order-item-details">
        <Box>
          <Typography variant="body1">
            Pedido <strong>#{order.id}</strong>
          </Typography>
          {isAdminView && (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Cliente: {order.user ? order.user.nombreCompleto : order.customerEmail || 'Invitado'}
            </Typography>
          )}
        </Box>
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ textAlign: { xs: 'left', sm: 'center' } }}
        >
          {formatTempo(order.createdAt, 'DD/MM/YYYY HH:mm')}
        </Typography>

        <Typography variant="body1" className={`order-item-status-chip ${chipClassName}`}>
          {formatStatus(order.status)}
        </Typography>
      </Box>
      <Divider sx={{ my: 1 }} />
      <Box className="order-item-summary">
        <Typography variant="body2">
          {order.orderItems?.length} {order.orderItems?.length === 1 ? 'producto' : 'productos'} -
          Total: <strong>${order.total?.toLocaleString()}</strong>
        </Typography>
        <ul>
          {order.orderItems?.slice(0, 3).map((item) => (
            <li key={item.id}>
              {item.itemNameSnapshot} (x{item.quantity})
            </li>
          ))}
          {order.orderItems?.length > 3 && <li>...y más</li>}
        </ul>
      </Box>

      {/* Botón Detalles */}
      <Button size="small" component={RouterLink} to={`/order-details/${order.id}`} sx={{ mt: 1 }}>
        Ver Detalles
      </Button>
    </Paper>
  );
};

export default OrderItemDisplay;
