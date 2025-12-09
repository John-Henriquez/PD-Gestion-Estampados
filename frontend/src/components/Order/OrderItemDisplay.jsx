import { Box, Typography, Divider, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { format as formatTempo } from '@formkit/tempo';

import '../../styles/components/orderItemDisplay.css';

const formatStatus = (status) => {
  const statusMap = {
    pendiente_de_pago: 'Pendiente de Pago',
    en_proceso: 'En Proceso',
    enviado: 'Enviado',
    completado: 'Completado',
    cancelado: 'Cancelado',
  };
  return statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const OrderItemDisplay = ({ order, isAdminView = false }) => {
  const statusClassName = `status-${order.status || 'default'}`;
  const chipClassName = `chip-${order.status || 'default'}`;

  return (
    <div className={`order-item-paper ${statusClassName}`}>
      <Box className="order-item-content-wrapper">
        <Box className="order-item-details">
          <Box>
            <Typography variant="body1">
              Pedido <strong>#{order.id}</strong>
            </Typography>
            {isAdminView && (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                {order.user
                  ? order.user.nombreCompleto
                  : order.guestEmail || order.customerName || 'Invitado'}
              </Typography>
            )}
          </Box>

          <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
            <Typography variant="body2" color="textSecondary">
              {formatTempo(order.createdAt, 'DD/MM/YYYY')}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {formatTempo(order.createdAt, 'HH:mm')}
            </Typography>
          </Box>
        </Box>

        {/* Chip de estado alineado */}
        <Box sx={{ mb: 2, mt: 1 }}>
          <Typography
            variant="body1"
            component="span"
            className={`order-item-status-chip ${chipClassName}`}
            sx={{ display: 'inline-block' }}
          >
            {formatStatus(order.status)}
          </Typography>
        </Box>

        <Divider sx={{ my: 1 }} />

        <Box className="order-item-summary">
          <Typography variant="body2" sx={{ mb: 1 }}>
            {order.orderItems?.length} {order.orderItems?.length === 1 ? 'artículo' : 'artículos'}
            &nbsp;•&nbsp; Total: <strong>${order.total?.toLocaleString('es-CL')}</strong>
          </Typography>
          <ul>
            {order.orderItems?.slice(0, 3).map((item) => (
              <li key={item.id}>
                {item.itemNameSnapshot}
                {item.quantity > 1 && (
                  <span style={{ fontWeight: 600, marginLeft: 4 }}> (x{item.quantity})</span>
                )}
              </li>
            ))}
            {order.orderItems?.length > 3 && (
              <li style={{ fontStyle: 'italic', color: '#888' }}>
                ...y {order.orderItems.length - 3} más
              </li>
            )}
          </ul>
        </Box>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          size="small"
          component={RouterLink}
          to={`/order-details/${order.id}`}
        >
          Ver Detalles
        </Button>
      </Box>
    </div>
  );
};

export default OrderItemDisplay;
