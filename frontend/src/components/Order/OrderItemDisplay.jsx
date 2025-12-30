import { Box, Typography, Divider, Button, Tooltip } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { format as formatTempo } from '@formkit/tempo';
import { Package, Clock, ChevronRight, Download, ExternalLink, Image as ImageIcon } from 'lucide-react';

import '../../styles/components/orderItemDisplay.css';

const getFullImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const backendUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
  return `${backendUrl.replace('/api', '')}${url}`;
};

const OrderItemDisplay = ({ order, isAdminView = false }) => {

  const statusSlug = order.status?.name || 'default';
  const statusLabel = order.status?.displayName || 'Desconocido';
  const navigate = useNavigate();

  const statusClassName = `status-${statusSlug}`;
  const chipClassName = `chip-${statusSlug}`;

  const handleDownloadImage = (url, fileName) => {
    const fullUrl = getFullImageUrl(url);
    fetch(fullUrl)
      .then(response => response.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `estampado_${fileName}.png`;
        link.click();
      });
  };

return (
    <div className={`order-card ${statusClassName} ${isAdminView ? 'admin-card' : ''}`}>
      <Box className="order-card-header">
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Package size={16} className="order-icon" />
            <Typography variant="subtitle1" fontWeight="800" className="order-number">
              ORDEN #{order.id}
            </Typography>
          </Box>
          {isAdminView && (
            <Typography variant="caption" className="order-customer-name" sx={{ display: 'block', mt: 0.5, color: 'var(--primary-dark)', fontWeight: 700 }}>
              👤 {order.user ? order.user.nombreCompleto : order.customerName || 'Invitado'}
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

      {/* VISTA DE PRODUCCIÓN (SOLO ADMIN) */}
      {isAdminView && order.orderItems?.some(item => item.stampImageUrl) && (
        <Box className="production-preview-section" sx={{ mt: 2, mb: 1 }}>
          <Typography variant="caption" fontWeight="800" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <ImageIcon size={14} /> ARCHIVOS DE PRODUCCIÓN
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
            {order.orderItems.map((item, idx) => item.stampImageUrl && (
              <Tooltip key={idx} title={`Descargar diseño para: ${item.itemNameSnapshot}`}>
                <Box 
                  className="production-thumb-container"
                  onClick={() => handleDownloadImage(item.stampImageUrl, order.id, idx)}
                  sx={{
                    position: 'relative',
                    width: 60,
                    height: 60,
                    borderRadius: '8px',
                    border: '2px solid var(--primary-light)',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    flexShrink: 0,
                    '&:hover .thumb-overlay': { opacity: 1 }
                  }}
                >
                  <img 
                    src={getFullImageUrl(item.stampImageUrl)} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <Box className="thumb-overlay" sx={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    bgcolor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'white', opacity: 0, transition: '0.2s'
                  }}>
                    <Download size={16} />
                  </Box>
                </Box>
              </Tooltip>
            ))}
          </Box>
        </Box>
      )}

      <Box className="order-card-body" sx={{ mt: isAdminView ? 0 : 1.5 }}>
        <ul className="items-preview-list">
          {order.orderItems?.map((item) => (
            <li key={item.id} className="item-preview">
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                <strong>{item.quantity}x</strong> {item.itemNameSnapshot}
              </Typography>
              {/* Detalles técnicos en vista Admin */}
              {isAdminView && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pl: 3, fontStyle: 'italic' }}>
                   Talla: {item.sizeSnapshot || 'N/A'} | Color: {item.colorNameSnapshot || 'N/A'}
                </Typography>
              )}
            </li>
          ))}
        </ul>
      </Box>

      <Box className="order-card-footer">
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">Total</Typography>
          <Typography variant="h6" fontWeight="800" color="primary.main">
            ${order.total?.toLocaleString('es-CL')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            component={RouterLink}
            to={`/order-details/${order.id}`}
            endIcon={<ChevronRight size={16} />}
            className="view-details-btn"
          >
            Detalles
          </Button>
        </Box>
      </Box>
    </div>
  );
};

export default OrderItemDisplay;
