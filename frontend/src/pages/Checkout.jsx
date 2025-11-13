import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Paper,
  Alert,
  Grid,
  Divider,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useCart } from '../hooks/cart/useCart.jsx';
import { createOrder } from '../services/order.service';
import { AuthContext } from '../context/AuthContext.jsx';
import { showSuccessAlert, showErrorAlert } from '../helpers/sweetAlert';

import { XCircle } from 'lucide-react';

const getFullImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const backendUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
  return `${backendUrl.replace('/api', '')}${url}`;
};

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, clearCart } = useCart();
  const { isAuthenticated, user } = useContext(AuthContext);

  const [customerData, setCustomerData] = useState({ name: '', email: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      setCustomerData({
        name: user.nombreCompleto || '',
        email: user.email || '',
      });
    } else {
      setCustomerData({ name: '', email: '' });
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isProcessing && cartItems.length === 0) {
      navigate('/shop');
    }
  }, [cartItems, isProcessing, navigate]);

  const handleGuestDataChange = (event) => {
    setCustomerData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmitOrder = async () => {
    setError(null);
    if (!isAuthenticated && !customerData.email) {
      setError('Por favor, ingresa tu dirección de correo electrónico.');
      showErrorAlert('Datos incompletos', 'Ingresa tu correo electrónico para continuar.');
      return;
    }
    if (cartItems.length === 0) {
      setError('Tu carrito está vacío.');
      showErrorAlert(
        'Carrito Vacío',
        'No hay items para procesar. Añade productos desde la tienda.'
      );
      return;
    }

    setIsProcessing(true);

    const orderPayload = {
      items: cartItems.map((item) => ({
        ...(item.itemStockId && { itemStockId: item.itemStockId }),
        ...(item.packId && { packId: item.packId }),
        quantity: Number(item.quantity) || 1,
        stampImageUrl: item.stampImageUrl,
        stampInstructions: item.stampInstructions,
        stampOptionsSnapshot: item.stampOptionsSnapshot,
      })),
      customerData: isAuthenticated ? null : customerData,
    };

    try {
      console.log('Enviando payload:', orderPayload);
      const createdOrder = await createOrder(orderPayload);
      setIsProcessing(false);
      showSuccessAlert('¡Pedido Creado!', `Tu pedido #${createdOrder.id} ha sido registrado.`);
      clearCart();
      navigate(`/order-confirmation/${createdOrder.id}`);
    } catch (err) {
      setIsProcessing(false);
      let displayError = err.message || err.details || 'No se pudo crear el pedido.';
      if (err.message?.toLowerCase().includes('stock insuficiente')) {
        displayError = `Stock insuficiente. ${err.message}`;
      } else if (err.status === 400 && Array.isArray(err.details)) {
        displayError = `Datos inválidos: ${err.details.map((d) => d.message).join('. ')}`;
      }
      setError(displayError);
      showErrorAlert('Error al Crear Pedido', displayError);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    );
  };

  return (
    <Box
      sx={{
        maxWidth: '900px',
        margin: 'var(--spacing-xl) auto',
        padding: 'var(--spacing-md)',
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          color: 'var(--primary-dark)',
          textAlign: 'center',
          mb: 'var(--spacing-lg)',
        }}
      >
        Revisión del Pedido
      </Typography>

      {/* Resumen */}
      <Paper
        elevation={2}
        sx={{
          padding: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-lg)',
          backgroundColor: 'var(--gray-100)',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: 'var(--primary)',
            pb: 1,
            mb: 2,
            borderBottom: '1px solid var(--gray-300)',
          }}
        >
          Tu Pedido ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
        </Typography>

        {cartItems.map((item, index) => (
          <React.Fragment key={item.cartItemId}>
            <Grid container spacing={3} sx={{ marginBottom: 'var(--spacing-md)' }}>
              <Button
                size="small"
                onClick={() => removeFromCart(item.cartItemId)} // Llama a removeFromCart
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  minWidth: 'auto',
                  padding: '2px',
                  color: 'var(--error)',
                  zIndex: 1, // Asegura que esté encima
                }}
                title="Eliminar este item del carrito"
              >
                <XCircle size={18} />
              </Button>
              {/* Columna Imagen Estampado */}
              {item.stampImageUrl && (
                <Grid item xs={12} sm={3} md={2} sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" display="block" gutterBottom>
                    Tu Diseño:
                  </Typography>
                  <img
                    src={getFullImageUrl(item.stampImageUrl)}
                    alt="Estampado"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100px',
                      borderRadius: 'var(--border-radius-sm)',
                      border: '1px solid var(--gray-300)',
                    }}
                    loading="lazy"
                  />
                </Grid>
              )}
              {/* Columna Detalles */}
              <Grid item xs={12} sm={item.stampImageUrl ? 9 : 12} md={item.stampImageUrl ? 10 : 12}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {item.name || `ID: ${item.itemStockId || item.packId}`}
                </Typography>
                <Typography variant="body2" color="var(--gray-700)">
                  Cantidad: {item.quantity}
                </Typography>
                <Typography variant="body2" color="var(--gray-700)">
                  Precio Unitario: ${item.price?.toLocaleString() || 'N/A'}
                </Typography>
                {item.stampInstructions && (
                  <Typography
                    variant="body2"
                    color="var(--gray-700)"
                    sx={{ mt: 1, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}
                  >
                    Instrucciones: {item.stampInstructions}
                  </Typography>
                )}
              </Grid>
            </Grid>
            {index < cartItems.length - 1 && <Divider sx={{ my: 'var(--spacing-md)' }} />}
          </React.Fragment>
        ))}

        <Typography
          variant="h6"
          align="right"
          sx={{ mt: 2, color: 'var(--primary-dark)', fontWeight: 'bold' }}
        >
          Total: ${calculateTotal().toLocaleString()}
        </Typography>
      </Paper>

      {/* Datos Invitado */}
      {!isAuthenticated && (
        <Paper
          elevation={2}
          sx={{
            padding: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-lg)',
            backgroundColor: 'var(--gray-100)',
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              color: 'var(--primary)',
              pb: 1,
              mb: 1,
              borderBottom: '1px solid var(--gray-300)',
            }}
          >
            Tus Datos (Invitado)
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre (Opcional)"
                name="name"
                value={customerData.name}
                onChange={handleGuestDataChange}
                fullWidth
                margin="normal"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Correo Electrónico"
                name="email"
                type="email"
                value={customerData.email}
                onChange={handleGuestDataChange}
                required
                fullWidth
                margin="normal"
                variant="outlined"
                helperText="Necesario para confirmar tu pedido."
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Error General */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {' '}
          {error}{' '}
        </Alert>
      )}

      {/* Botones */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 'var(--spacing-lg)',
          gap: 'var(--spacing-md)',
        }}
      >
        {/* Botón Seguir Comprando */}
        <Button
          variant="outlined"
          component={RouterLink} // Usar Link de react-router
          to="/shop" // Enlace a la tienda
          sx={{ flexGrow: 1 }} // Ocupa espacio disponible
        >
          Seguir Comprando
        </Button>

        {/* Botón Confirmar Pedido */}
        <Button
          variant="contained"
          onClick={handleSubmitOrder}
          disabled={isProcessing || cartItems.length === 0}
          size="large"
          className="animate--pulse"
          sx={{
            flexGrow: 2, // Más grande que el otro botón
            padding: 'var(--spacing-sm) 0',
            backgroundColor: 'var(--success)',
            color: 'white',
            fontWeight: 600,
            fontSize: '1.1rem',
            borderRadius: 'var(--border-radius-md)',
            '&:hover': { backgroundColor: 'var(--success-dark)' },
            '&:disabled': {
              backgroundColor: 'var(--gray-300)',
              cursor: 'not-allowed',
            },
          }}
          startIcon={isProcessing ? <CircularProgress size={24} color="inherit" /> : null}
        >
          {isProcessing ? 'Procesando...' : 'Confirmar y Realizar Pedido'}
        </Button>
      </Box>
    </Box>
  );
};

export default Checkout;
