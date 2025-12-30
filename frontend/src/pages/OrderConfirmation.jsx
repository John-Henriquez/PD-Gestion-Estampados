import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Alert, Paper, Divider } from '@mui/material';
import { CheckCircle, XCircle, Clock, ArrowRight, ShoppingBag } from 'lucide-react';
import { getOrderById } from '../services/order.service';
import { createPaymentPreference, verifyPaymentStatus } from '../services/payment.service';
import { useCart } from '../hooks/cart/useCart';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryLoading, setRetryLoading] = useState(false);

  //const [verificationStatus, setVerificationStatus] = useState('idle');

  const paymentId = searchParams.get('payment_id');
  const statusMP = searchParams.get('status');

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        if (paymentId && statusMP === 'approved') {
          try {
            await verifyPaymentStatus(paymentId, orderId);
            clearCart();
          } catch (err) {
            console.error('Error verificando pago:', err);
          }
        }

        const orderData = await getOrderById(orderId);
        setOrder(orderData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [orderId, paymentId, statusMP]);

  const handleRetryPayment = async () => {
    try {
      setRetryLoading(true);
      const preference = await createPaymentPreference(orderId);
      const url = preference.sandbox_init_point || preference.init_point;
      if (url) window.location.href = url;
    } catch (error) {
      console.error(error);
    } finally {
      setRetryLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10, gap: 2 }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="text.secondary">
          Sincronizando pago...
        </Typography>
      </Box>
    );
  }

  if (!order) return;
  <Alert severity="error" sx={{ mt: 5, mx: 'auto', maxWidth: 600 }}>
    No se encontró el pedido.
  </Alert>;

  const isApprovedByMP = statusMP === 'approved';
  const isPaidInDB = ['en_proceso', 'completado', 'enviado'].includes(order.status?.name || order.status);

  let viewMode = 'pending';
  if (isApprovedByMP || isPaidInDB) viewMode = 'success';
  if (statusMP === 'failure' || statusMP === 'rejected') viewMode = 'error';

return (
    <Box sx={{ maxWidth: 700, margin: '2rem auto', p: 2 }}>
      <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, textAlign: 'center' }}>
        
        {/* MODO ÉXITO */}
        {viewMode === 'success' && (
          <Box>
            <CheckCircle size={80} color="var(--success)" fill="#e8f5e9" style={{ marginBottom: '1.5rem' }} />
            <Typography variant="h3" fontWeight="800" gutterBottom sx={{ color: 'var(--success)' }}>
              ¡Pago Exitoso!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: '1.1rem' }}>
              Referencia de Pedido: <strong>#{order.id}</strong>
            </Typography>
            <Alert severity="success" sx={{ mb: 3, justifyContent: 'center', borderRadius: 2 }}>
              Tu pago se acreditó correctamente. Hemos enviado un correo con los detalles.
            </Alert>
          </Box>
        )}

        {/* MODO ERROR */}
        {viewMode === 'error' && (
          <Box>
            <XCircle size={80} color="var(--error)" fill="#ffebee" style={{ marginBottom: '1.5rem' }} />
            <Typography variant="h3" fontWeight="800" gutterBottom sx={{ color: 'var(--error)' }}>
              Pago Rechazado
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: '1.1rem' }}>
              Referencia de Pedido: <strong>#{order.id}</strong>
            </Typography>
            <Alert severity="error" sx={{ mb: 3, justifyContent: 'center', borderRadius: 2 }}>
              Hubo un problema con tu tarjeta. Por favor intenta nuevamente.
            </Alert>
          </Box>
        )}

        {/* MODO PENDIENTE (Solo si no es éxito ni error) */}
        {viewMode === 'pending' && (
          <Box>
            <Clock size={80} color="var(--warning)" fill="#fff3e0" style={{ marginBottom: '1.5rem' }} />
            <Typography variant="h3" fontWeight="800" gutterBottom sx={{ color: 'var(--warning)' }}>
              Pedido Registrado
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: '1.1rem' }}>
              Referencia de Pedido: <strong>#{order.id}</strong>
            </Typography>
            <Alert severity="info" sx={{ mb: 3, justifyContent: 'center', borderRadius: 2 }}>
              Tu pedido está guardado pero pendiente de pago.
            </Alert>
          </Box>
        )}

        <Divider sx={{ my: 4 }} />

        {/* BOTONES DINÁMICOS SEGÚN EL MODO */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          {viewMode !== 'success' && (
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleRetryPayment}
              disabled={retryLoading}
              sx={{
                bgcolor: 'var(--primary)',
                py: 1.5,
                maxWidth: 400,
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              {retryLoading ? <CircularProgress size={24} color="inherit" /> : 'Reintentar Pago'}
            </Button>
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              startIcon={<ShoppingBag size={18} />}
              onClick={() => navigate('/shop')}
              sx={{ color: 'text.secondary' }}
            >
              Volver a la Tienda
            </Button>
            <Button
              endIcon={<ArrowRight size={18} />}
              onClick={() => navigate('/my-orders')}
              variant="outlined"
            >
              Ver Mis Pedidos
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default OrderConfirmation;
