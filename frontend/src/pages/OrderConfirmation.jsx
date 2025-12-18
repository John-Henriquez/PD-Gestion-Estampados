import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Alert, Paper, Divider } from '@mui/material';
import { CheckCircle, XCircle, Clock, ArrowRight, ShoppingBag } from 'lucide-react';
import { getOrderById } from '../services/order.service';
import { createPaymentPreference, verifyPaymentStatus } from '../services/payment.service';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState('idle');
  const [retryLoading, setRetryLoading] = useState(false);

  const paymentId = searchParams.get('payment_id');
  const statusMP = searchParams.get('status');

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        if (paymentId && statusMP === 'approved') {
          setVerificationStatus('verifying');
          try {
            await verifyPaymentStatus(paymentId, orderId);
            setVerificationStatus('success');
          } catch (err) {
            console.error('Error verificando pago:', err);
            setVerificationStatus('error');
          }
        } else if (statusMP === 'failure') {
          setVerificationStatus('rejected');
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

  const isPaid =
    order.status === 'en_proceso' || order.status === 'completado' || order.status === 'enviado';
  const isRejected = statusMP === 'failure';

  return (
    <Box sx={{ maxWidth: 700, margin: '2rem auto', p: 2 }}>
      <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, textAlign: 'center' }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          {isPaid ? (
            <CheckCircle size={80} color="var(--success)" fill="#e8f5e9" />
          ) : isRejected ? (
            <XCircle size={80} color="var(--error)" fill="#ffebee" />
          ) : (
            <Clock size={80} color="var(--warning)" fill="#fff3e0" />
          )}
        </Box>
        <Typography
          variant="h3"
          fontWeight="800"
          gutterBottom
          sx={{ color: 'var(--primary-dark)' }}
        >
          {isPaid ? '¡Pago Exitoso!' : isRejected ? 'Pago Rechazado' : 'Pedido Registrado'}
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: '1.1rem' }}>
          Referencia de Pedido: <strong>#{order.id}</strong>
        </Typography>

        {verificationStatus === 'success' && (
          <Alert severity="success" sx={{ mb: 3, justifyContent: 'center' }}>
            Tu pago se acreditó correctamente. Hemos enviado un correo con los detalles.
          </Alert>
        )}

        {isRejected && (
          <Alert severity="error" sx={{ mb: 3, justifyContent: 'center' }}>
            Hubo un problema con tu tarjeta. Por favor intenta nuevamente.
          </Alert>
        )}

        {!isPaid && !isRejected && (
          <Alert severity="info" sx={{ mb: 3, justifyContent: 'center' }}>
            Tu pedido está guardado pero pendiente de pago.
          </Alert>
        )}

        <Divider sx={{ my: 4 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          {!isPaid && (
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
                boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)',
              }}
            >
              {retryLoading ? <CircularProgress size={24} color="inherit" /> : 'Pagar Ahora'}
            </Button>
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              startIcon={<ShoppingBag />}
              onClick={() => navigate('/shop')}
              sx={{ color: 'text.secondary' }}
            >
              Volver a la Tienda
            </Button>
            <Button
              endIcon={<ArrowRight />}
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
