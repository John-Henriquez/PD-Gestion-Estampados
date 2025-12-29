import { Box, Typography, Divider, Button, Tooltip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { format as formatTempo } from '@formkit/tempo';
import { Package, Clock, ChevronRight } from 'lucide-react';

import '../../styles/components/orderItemDisplay.css';

const OrderItemDisplay = ({ order, isAdminView = false }) => {
  const statusSlug = order.status?.name || 'default';
  const statusLabel = order.status?.displayName || 'Desconocido';

  const statusClassName = `status-${statusSlug}`;
  const chipClassName = `chip-${statusSlug}`;

return (
    <div className={`order-card ${statusClassName}`}>
      <Box className="order-card-header">
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Package size={16} className="order-icon" />
            <Typography variant="subtitle1" fontWeight="800" className="order-number">
              ORDEN #{order.id}
            </Typography>
          </Box>
          {isAdminView && (
            <Typography variant="caption" className="order-customer-name">
              {order.user ? order.user.nombreCompleto : order.customerName || 'Invitado'}
            </Typography>
          )}
        </Box>
        <Box className="order-date-box">
          <Typography variant="caption" fontWeight="600">
            {formatTempo(order.createdAt, 'DD MMM, YYYY')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
            <Clock size={12} />
            <Typography variant="caption">{formatTempo(order.createdAt, 'HH:mm')}</Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mt: 1.5, mb: 2 }}>
        <span className={`status-badge ${chipClassName}`}>
          {statusLabel}
        </span>
      </Box>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box className="order-card-body">
        <Typography variant="body2" className="items-count">
          {order.orderItems?.length} {order.orderItems?.length === 1 ? 'Producto' : 'Productos'}
        </Typography>
        
        <ul className="items-preview-list">
          {order.orderItems?.slice(0, 2).map((item) => (
            <li key={item.id} className="item-preview">
              {item.itemNameSnapshot} <span>x{item.quantity}</span>
            </li>
          ))}
          {order.orderItems?.length > 2 && (
            <li className="more-items">+{order.orderItems.length - 2} productos más...</li>
          )}
        </ul>
      </Box>

      <Box className="order-card-footer">
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">Total Pagado</Typography>
          <Typography variant="h6" fontWeight="800" color="primary.main">
            ${order.total?.toLocaleString('es-CL')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          component={RouterLink}
          to={`/order-details/${order.id}`}
          endIcon={<ChevronRight size={16} />}
          className="view-details-btn"
        >
          Ver
        </Button>
      </Box>
    </div>
  );
};

export default OrderItemDisplay;
