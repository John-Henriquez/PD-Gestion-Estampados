import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { ArrowLeft, FileText, Receipt } from 'lucide-react';
import { getOrderById } from '../services/order.service';
import { generateOrderReceipt } from '../helpers/pdfGenerator';
import { showErrorAlert } from '../helpers/sweetAlert';
import '../styles/pages/orderDetail.css';

const formatDate = (dateString) => {
  if (!dateString) return 'Fecha desconocida';
  try {
    const date = new Date(dateString);
    // Formato: 13 de noviembre de 2025, 18:18
    return new Intl.DateTimeFormat('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch (e) {
    console.error('Error al formatear fecha:', e);
    return dateString;
  }
};

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await getOrderById(id);
        setOrder(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Error al cargar el pedido');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleDownloadBoleta = () => {
    if (order) {
      try {
        generateOrderReceipt(order);
      } catch (e) {
        console.error(e);
        showErrorAlert('Error', 'No se pudo generar el PDF');
      }
    }
  };

  const handleRequestFactura = () => {
    // Placeholder para funcionalidad futura
    showErrorAlert(
      'Funcionalidad en desarrollo',
      'Para emitir factura necesitamos registrar datos de empresa (Razón social, Giro).'
    );
  };

  if (loading)
    return (
      <Box className="inventory-loading">
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Box className="order-detail-container">
        <Alert severity="error">{error}</Alert>
        <Button component={RouterLink} to="/my-orders" startIcon={<ArrowLeft />} sx={{ mt: 2 }}>
          Volver
        </Button>
      </Box>
    );

  if (!order) return null;

  const getColorDisplay = (item) => {
    if (item.colorNameSnapshot) return item.colorNameSnapshot;
    if (item.colorHexSnapshot)
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          Color
          <span
            style={{
              backgroundColor: item.colorHexSnapshot,
              width: 14,
              height: 14,
              borderRadius: '50%',
              display: 'inline-block',
              marginLeft: 6,
              border: '1px solid #ccc',
            }}
            title={item.colorHexSnapshot}
          />
        </span>
      );
    return null;
  };

  return (
    <Box className="order-detail-container">
      <Button
        component={RouterLink}
        to="/my-orders"
        startIcon={<ArrowLeft />}
        sx={{ mb: 2, color: 'var(--gray-700)' }}
      >
        Volver a Mis Pedidos
      </Button>

      <Grid container spacing={3}>
        {/* --- Columna Izquierda: Detalles del Pedido --- */}
        <Grid item xs={12} md={8}>
          <Paper className="detail-paper">
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Typography variant="h5" component="h1" fontWeight="700" color="primary">
                Pedido #{order.id}
              </Typography>
              <Chip
                label={order.status.replace(/_/g, ' ').toUpperCase()}
                className={`status-chip status-${order.status}`}
              />
            </Box>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Realizado el {formatDate(order.createdAt)}
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Productos
            </Typography>

            <Box className="items-list">
              {order.orderItems?.map((item) => (
                <Box key={item.id} className="item-row">
                  {/* Icono Placeholder */}
                  <Box className="item-image-placeholder"> {item.pack ? '📦' : '👕'} </Box>

                  <Box className="item-info">
                    <Typography variant="subtitle1" fontWeight="600">
                      {item.itemNameSnapshot || 'Nombre del producto no disponible'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.sizeSnapshot && `Talla: ${item.sizeSnapshot}`}
                      {item.sizeSnapshot &&
                        (item.colorHexSnapshot || item.colorNameSnapshot) &&
                        ' | '}
                      {getColorDisplay(item)}
                    </Typography>

                    {item.stampOptionsSnapshot && (
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 0.5, color: 'var(--primary)', fontStyle: 'italic' }}
                      >
                        + Estampado: {item.stampOptionsSnapshot.level}
                      </Typography>
                    )}
                  </Box>

                  <Box className="item-pricing">
                    <Typography variant="body2" color="text.secondary">
                      {item.quantity} x ${item.priceAtTime?.toLocaleString()}
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="bold">
                      ${(item.quantity * item.priceAtTime).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* --- Columna Derecha: Resumen y Documentos --- */}
        <Grid item xs={12} md={4}>
          <Paper className="summary-paper">
            <Typography variant="h6" gutterBottom fontWeight="600">
              Resumen de Pago
            </Typography>

            <Box className="summary-row">
              <Typography color="text.secondary">Subtotal (Neto aprox)</Typography>
              <Typography>${Math.round(order.subtotal / 1.19).toLocaleString()}</Typography>
            </Box>
            <Box className="summary-row">
              <Typography color="text.secondary">IVA (19%)</Typography>
              <Typography>
                ${(order.total - Math.round(order.total / 1.19)).toLocaleString()}
              </Typography>
            </Box>

            <Box className="summary-row total-row">
              <Typography fontWeight="bold">Total Pagado</Typography>
              <Typography fontWeight="bold" variant="h5" color="primary">
                ${order.total.toLocaleString()}
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              Documentos Tributarios
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Descarga tu comprobante de compra.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<Receipt size={20} />}
                onClick={handleDownloadBoleta}
                fullWidth
                sx={{
                  backgroundColor: 'var(--primary)',
                  '&:hover': { backgroundColor: 'var(--primary-dark)' },
                }}
              >
                Descargar Boleta
              </Button>

              <Button
                variant="outlined"
                startIcon={<FileText size={20} />}
                onClick={handleRequestFactura}
                fullWidth
                color="secondary"
                sx={{ borderColor: 'var(--gray-300)', color: 'var(--gray-700)' }}
              >
                Solicitar Factura
              </Button>
            </Box>
          </Paper>

          {/* Card de Información de Cliente */}
          <Paper className="summary-paper" sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="600">
              Datos del Cliente
            </Typography>

            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Nombre
              </Typography>
              <Typography variant="body2">
                {order.user ? order.user.nombreCompleto : order.customerName || 'Invitado'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Contacto
              </Typography>
              <Typography variant="body2">
                {order.user ? order.user.email : order.guestEmail}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrderDetail;
