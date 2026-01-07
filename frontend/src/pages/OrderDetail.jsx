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
  Alert, Chip, Stepper, Step, StepLabel,
} from '@mui/material';
import { ArrowLeft, Receipt, User, MapPin, Phone } from 'lucide-react';
import Swal from 'sweetalert2';
import { getOrderById, updateOrderStatus } from '../services/order.service';
import { generateOrderReceipt } from '../helpers/pdfGenerator';
import { showErrorAlert, showSuccessAlert, deleteDataAlert } from '../helpers/sweetAlert';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/pages/orderDetail.css';

const ORDER_STEPS = [
  { label: 'Pendiente de Pago', value: 'pendiente_de_pago' },
  { label: 'En Proceso', value: 'en_proceso' },
  { label: 'Enviado', value: 'enviado' },
  { label: 'Completado', value: 'completado' },
];

const formatDate = (dateString) => {
  if (!dateString) return 'Fecha desconocida';
  try {
    const date = new Date(dateString);
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
  const { user } = useAuth();
  const isAdmin = user?.rol === 'administrador';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const currentStatusName = order?.status?.name;

  const activeStep = order 
    ? ORDER_STEPS.findIndex((s) => s.value === currentStatusName) 
    : 0;
  const isCancelled = currentStatusName === 'cancelado' || currentStatusName === 'fallido';

  const changeStatus = async (newStatusName) => {
    setUpdatingStatus(true);
    try {
      await updateOrderStatus(order.id, newStatusName);
      showSuccessAlert(
        'Estado Actualizado',
        `El pedido ahora está: ${newStatusName.replace(/_/g, ' ')}`
      );
      await fetchOrder();
    } catch (err) {
      showErrorAlert('Error', err.message || 'No se pudo actualizar el estado');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAdvanceStep = async () => {
    if (activeStep >= ORDER_STEPS.length - 1) return;
    const nextStep = ORDER_STEPS[activeStep + 1];
    const nextStatus = nextStep.value;

    const result = await Swal.fire({
      title: '¿Avanzar etapa?',
      text: `El pedido pasará al estado: ${nextStep.label}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, avanzar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      await changeStatus(nextStatus);
    }
  };
  
  const handleCancelOrder = async () => {
    const result = await deleteDataAlert(
      '¿Cancelar este pedido?',
      'Esta acción detendrá el proceso. Puedes revertirlo manualmente si es necesario contactando a soporte técnico.'
    );

    if (result.isConfirmed) {
      await changeStatus('cancelado');
    }
  };

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

  /*   const handleRequestFactura = () => {
    showErrorAlert(
      'Funcionalidad en desarrollo',
      'Para emitir factura necesitamos registrar datos de empresa (Razón social, Giro).'
    );
  }; */

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

  console.log("Datos de la orden recibidos:", order);

  return (
    <Box className="order-detail-container">
      <Button
        component={RouterLink}
        to={isAdmin ? '/admin/orders' : '/my-orders'}
        startIcon={<ArrowLeft />}
        sx={{ mb: 2, color: 'var(--gray-700)' }}
      >
        {isAdmin ? 'Volver a Gestión de Pedidos' : 'Volver a Mis Pedidos'}
      </Button>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper className="detail-paper">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1, }}>
              <Typography variant="h5" component="h1" fontWeight="700" color="primary">
                Pedido #{order.id}
              </Typography>

              <Chip
                label={order.status?.displayName?.toUpperCase() || 'DESCONOCIDO'}
                className={`status-chip status-${order.status?.name}`}
              />
            </Box>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Realizado el {formatDate(order.createdAt)}
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Estado del pedido
            </Typography>

            {isCancelled ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                Este pedido se encuentra en estado: {order.status?.displayName}
              </Alert>
            ) : (
              <Box sx={{ width: '100%', mb: 4, mt: 2 }}>
                <Stepper activeStep={activeStep} alternativeLabel>
                  {ORDER_STEPS.map((step) => (
                    <Step key={step.value}>
                      <StepLabel>{step.label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>
            )}

            {/* CONTROLES DE ADMINISTRADOR */}

            {isAdmin && !isCancelled && activeStep < ORDER_STEPS.length - 1 && (
              <Box sx={{ p: 2, bgcolor: 'var(--gray-100)', borderRadius: 2, mb: 3, border: '1px dashed var(--gray-300)', }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Zona de Administración
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAdvanceStep}
                    disabled={updatingStatus}
                  >
                    {updatingStatus
                      ? 'Actualizando...'
                      : `Avanzar a: ${ORDER_STEPS[activeStep + 1]?.label}`}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleCancelOrder}
                    disabled={updatingStatus}
                  >
                    Cancelar Pedido
                  </Button>
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Productos
            </Typography>

            <Box className="items-list">
              {order.orderItems?.map((item) => (
                <Box key={item.id} className="item-row">
                  {/* Icono Placeholder */}

                  <Box className="item-info">
                    <Typography variant="subtitle1" fontWeight="600">
                      {item.itemNameSnapshot || 'Nombre del producto no disponible'}
                    </Typography>

                    {!item.pack && (
                      <Typography variant="body2" color="text.secondary">
                        {item.sizeSnapshot && `Talla: ${item.sizeSnapshot}`}
                        {item.sizeSnapshot &&
                          (item.colorHexSnapshot || item.colorNameSnapshot) &&
                          ' | '}
                        {getColorDisplay(item)}
                      </Typography>
                    )}

                    {item.pack && item.pack.packItems && (
                      <Box sx={{ mt: 1, padding: 1, backgroundColor: 'var(--gray-100)', borderRadius: 1, }}>
                        <Typography variant="caption" fontWeight="bold" color="text.secondary">
                          Contenido del Pack:
                        </Typography>
                        <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
                          {item.pack.packItems.map((pi) => (
                            <li key={pi.id}>
                              <Typography variant="caption" component="span">
                                {pi.quantity}x {pi.itemStock?.itemType?.name}
                                {pi.itemStock?.size ? ` (${pi.itemStock.size})` : ''}
                                <span
                                  style={{
                                    display: 'inline-block',
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    backgroundColor: pi.itemStock?.hexColor,
                                    marginLeft: 6,
                                    border: '1px solid #ccc',
                                    verticalAlign: 'middle',
                                  }}
                                  title={pi.itemStock?.hexColor}
                                />
                              </Typography>
                            </li>
                          ))}
                        </ul>
                      </Box>
                    )}

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

              {/* <Button
                variant="outlined"
                startIcon={<FileText size={20} />}
                onClick={handleRequestFactura}
                fullWidth
                color="secondary"
                sx={{ borderColor: 'var(--gray-300)', color: 'var(--gray-700)' }}
              >
                Solicitar Factura
              </Button> */}
            </Box>
          </Paper>
        </Grid>

        {/* Información de Cliente */}
        <Grid item xs={12}>
          <Paper className="detail-paper">
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
               <Typography variant="h6" fontWeight="600">
                Información de Envío y Cliente
              </Typography>
            </Box>
            
            <Grid container spacing={4}>
              {/* Columna 1: Destinatario */}
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <User size={24} color="var(--gray-500)" style={{ marginTop: 2 }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Destinatario
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {order.user ? order.user.nombreCompleto : order.customerName || 'Invitado'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Columna 2: Contacto */}
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Phone size={24} color="var(--gray-500)" style={{ marginTop: 2 }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Datos de Contacto
                    </Typography>
                    <Typography variant="body2">
                      {order.user ? order.user.email : order.guestEmail}
                    </Typography>
                    {order.customerPhone && (
                      <Typography variant="body2" fontWeight="500">
                        {order.customerPhone}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>

              {/* Columna 3: Dirección */}
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <MapPin size={24} color="var(--gray-500)" style={{ marginTop: 2 }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Dirección de Entrega
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {order.shippingAddress || 'Retiro en tienda / Pendiente'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
};

export default OrderDetail;
