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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useCart } from '../hooks/cart/useCart.jsx';
import { createOrder } from '../services/order.service';
import { AuthContext } from '../context/AuthContext.jsx';
import { showErrorAlert, deleteDataAlert } from '../helpers/sweetAlert';
import { Trash2 } from 'lucide-react';
import { regionesYComunas } from '../data/chileData';
import { createPaymentPreference } from '../services/payment.service';

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
  const [addressDetails, setAddressDetails] = useState({
    region: '',
    comuna: '',
    street: '',
    phone: '',
  });

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

  const handleCustomerDataChange = (event) => {
    setCustomerData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };
  const handleAddressChange = (event) => {
    const { name, value } = event.target;
    if (name === 'region') {
      setAddressDetails((prev) => ({ ...prev, region: value, comuna: '' }));
    } else {
      setAddressDetails((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRemoveItem = async (itemId) => {
    const result = await deleteDataAlert(
      '¿Eliminar producto?',
      'Se quitará este producto de tu pedido actual.',
      'Sí, quitar'
    );
    if (result.isConfirmed) {
      removeFromCart(itemId);
    }
  };
  const handleSubmitOrder = async () => {
    setError(null);
    if (!isAuthenticated && !customerData.email) {
      setError('Por favor, ingresa tu dirección de correo electrónico.');
      showErrorAlert('Datos incompletos', 'Ingresa tu correo electrónico para continuar.');
      return;
    }
    if (
      !addressDetails.region ||
      !addressDetails.comuna ||
      !addressDetails.street ||
      !addressDetails.phone
    ) {
      setError(
        'Por favor, completa todos los datos de envío (Región, Comuna, Dirección y Teléfono).'
      );
      showErrorAlert('Datos faltantes', 'Completa la dirección de envío.');
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
    const fullAddress = `${addressDetails.street}, ${addressDetails.comuna}, ${addressDetails.region}`;

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
      shippingData: {
        phone: addressDetails.phone,
        address: fullAddress,
      },
    };

    try {
      const createdOrder = await createOrder(orderPayload);
      const preference = await createPaymentPreference(createdOrder.id);

      if (preference && preference.init_point) {
        // Limpiamos el carro antes de irnos
        clearCart();
        // REDIRECCIÓN A MERCADO PAGO
        window.location.href = preference.init_point;
      } else {
        throw new Error('No se recibió el link de pago.');
      }
    } catch (err) {
      setIsProcessing(false);
      let displayError = err.message || 'Error al procesar el pago.';
      setError(displayError);
      showErrorAlert('Error', displayError);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    );
  };

  const selectedRegionData = regionesYComunas.find((r) => r.region === addressDetails.region);
  const availableComunas = selectedRegionData ? selectedRegionData.comunas : [];

  return (
    <Box
      sx={{
        maxWidth: '900px',
        margin: 'var(--spacing-xl) auto',
        padding: 'var(--spacing-md)',
        paddingTop: '4.5rem',
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
            <Grid
              container
              spacing={3}
              sx={{ marginBottom: 'var(--spacing-md)', position: 'relative' }}
            >
              <Tooltip title="Eliminar del carrito">
                <IconButton
                  size="small"
                  onClick={() => handleRemoveItem(item.cartItemId)}
                  sx={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    backgroundColor: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    color: 'var(--error)',
                    zIndex: 2,
                    '&:hover': {
                      backgroundColor: '#ffebee',
                    },
                  }}
                >
                  <Trash2 size={18} />
                </IconButton>
              </Tooltip>
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
          Datos de Envío y Contacto
        </Typography>

        <Grid container spacing={2}>
          {!isAuthenticated && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nombre Completo"
                  name="name"
                  value={customerData.name}
                  onChange={handleCustomerDataChange}
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
                  onChange={handleCustomerDataChange}
                  required
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  helperText="Para enviarte el comprobante."
                />
              </Grid>
            </>
          )}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Región</InputLabel>
              <Select
                name="region"
                value={addressDetails.region}
                label="Región"
                onChange={handleAddressChange}
              >
                {regionesYComunas.map((reg) => (
                  <MenuItem key={reg.region} value={reg.region}>
                    {reg.region}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required disabled={!addressDetails.region}>
              <InputLabel>Comuna</InputLabel>
              <Select
                name="comuna"
                value={addressDetails.comuna}
                label="Comuna"
                onChange={handleAddressChange}
              >
                {availableComunas.map((com) => (
                  <MenuItem key={com} value={com}>
                    {com}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={8}>
            <TextField
              label="Calle, Número, Depto"
              name="street"
              value={addressDetails.street}
              onChange={handleAddressChange}
              required
              fullWidth
              variant="outlined"
              placeholder="Ej: Av. Siempre Viva 742"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Teléfono / Celular"
              name="phone"
              value={addressDetails.phone}
              onChange={handleAddressChange}
              required
              fullWidth
              margin="normal"
              variant="outlined"
              placeholder="+569..."
            />
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

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
        <Button variant="outlined" component={RouterLink} to="/shop" sx={{ flexGrow: 1 }}>
          Seguir Comprando
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmitOrder}
          disabled={isProcessing || cartItems.length === 0}
          size="large"
          className="animate--pulse"
          sx={{
            flexGrow: 2,
            backgroundColor: 'var(--success)',
            color: 'white',
            fontWeight: 600,
            '&:hover': { backgroundColor: 'var(--success-dark)' },
            '&:disabled': { backgroundColor: 'var(--gray-300)' },
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
