import React, { useState, useContext, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, CircularProgress, Paper, Alert,
  Grid, Divider, MenuItem, Select, FormControl, 
  InputLabel, IconButton, Tooltip, Chip,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useCart } from '../hooks/cart/useCart.jsx';
import { createOrder } from '../services/order.service';
import { AuthContext } from '../context/AuthContext.jsx';
import { showErrorAlert, deleteDataAlert } from '../helpers/sweetAlert';
import { Trash2, Truck, Info, Eye }from 'lucide-react';
import { createPaymentPreference } from '../services/payment.service';
import { useGeography } from '../hooks/useGeography';
import '../styles/pages/checkout.css';

const getFullImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const backendUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
  return `${backendUrl.replace('/api', '')}${url}`;
};

const Checkout = () => {
  const { 
    regions, 
    comunas, 
    loadingComunas, 
    fetchComunas, 
    error: geoError 
  } = useGeography();

  const navigate = useNavigate();
  const { cartItems, removeFromCart, clearCart } = useCart();
  const { isAuthenticated, user } = useContext(AuthContext);

  const [customerData, setCustomerData] = useState({ name: '', email: '' });
  const [addressDetails, setAddressDetails] = useState({
    regionId: '',
    comunaId: '',
    street: '',
    phone: '',
  });

  const [selectedComunaData, setSelectedComunaData] = useState(null);

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

const handleRegionChange = (event) => {
  const regionId = Number(event.target.value);

  setAddressDetails(prev => ({
    ...prev,
    regionId,
    comunaId: ''
  }));

  setSelectedComunaData(null);
  fetchComunas(regionId);
};

const handleComunaChange = (event) => {
  const comunaId = Number(event.target.value);

  const comunaData = comunas.find(c => c.id === comunaId);

  setAddressDetails(prev => ({ ...prev, comunaId }));
  setSelectedComunaData(comunaData);
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
      !addressDetails.regionId ||
      !addressDetails.comunaId ||
      !addressDetails.street ||
      !addressDetails.phone
    ) {
      setError('Por favor, completa todos los datos de envío.');
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
        street: addressDetails.street,
        comunaId: addressDetails.comunaId,
        regionId: addressDetails.regionId,
      },
    };

    try {
      const createdOrder = await createOrder(orderPayload);
      const preference = await createPaymentPreference(createdOrder.id);

      if (preference && preference.init_point) {
        clearCart();
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

  const handleViewDetails = (e, item) => {
    e.stopPropagation();
    const path = item.packId ? `/pack/${item.packId}` : `/product/${item.itemTypeId}`;
    navigate(path, { state: { editItem: item } });
  };

  return (
    <Box className="checkout-container">
      <Typography variant="h4" className="checkout-title">
        Revisión del Pedido
      </Typography>

      {/* Resumen */}
      <Paper elevation={2} className="checkout-paper">
        <Typography variant="h6" className="checkout-section-title">
          Tu Pedido ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
        </Typography>

        {cartItems.map((item, index) => (
          <React.Fragment key={item.cartItemId}>
            <Grid
              container
              spacing={3}
              className="cart-item-row"
              onDoubleClick={(e) => handleViewDetails(e, item)}
            >
              <Box className="cart-item-actions">
                <Tooltip title="Ver detalles">
                  <IconButton
                    size="small"
                    className="action-button action-button--view"
                    onClick={(e) => handleViewDetails(e, item)}
                  >
                    <Eye size={18} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Eliminar del carrito">
                  <IconButton
                    size="small"
                    className="action-button action-button--delete"
                    onClick={() => handleRemoveItem(item.cartItemId)}
                  >
                    <Trash2 size={18} />
                  </IconButton>
                </Tooltip>
              </Box>
              {/* Columna Imagen Estampado */}
              {item.stampImageUrl && (
                <Grid item xs={12} sm={3} md={2} sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" display="block" gutterBottom>
                    Tu Diseño:
                  </Typography>
                  <img
                    src={getFullImageUrl(item.stampImageUrl)}
                    alt="Estampado"
                    className="cart-item-image"
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
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', my: 0.5 }}>
                  {/* Mostrar Color */}
                  {item.colorName && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="var(--gray-700)">Color:</Typography>
                      <Box 
                        sx={{ 
                          width: 14, 
                          height: 14, 
                          borderRadius: '50%', 
                          bgcolor: item.hexColor, 
                          border: '1px solid #ccc' 
                        }} 
                      />
                      <Typography variant="body2" fontWeight="500">{item.colorName}</Typography>
                    </Box>
                  )}

                  {/* Mostrar Talla (solo si existe) */}
                  {item.size && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="var(--gray-700)">Talla:</Typography>
                      <Chip 
                        label={item.size} 
                        size="small" 
                        variant="outlined" 
                        sx={{ fontWeight: 'bold', height: '20px' }} 
                      />
                    </Box>
                  )}
                </Box>
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

      <Paper elevation={2} sx={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', backgroundColor: 'var(--gray-100)' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'var(--primary)', pb: 1, mb: 1, borderBottom: '1px solid var(--gray-300)' }}>
          Datos de Envío y Contacto
        </Typography>

        <Grid container spacing={2}>
          {!isAuthenticated && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField label="Nombre Completo" name="name" value={customerData.name} onChange={handleCustomerDataChange} fullWidth margin="normal" variant="outlined" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Correo Electrónico" name="email" type="email" value={customerData.email} onChange={handleCustomerDataChange} required fullWidth margin="normal" variant="outlined" />
              </Grid>
            </>
          )}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Región</InputLabel>
              <Select
                value={addressDetails.regionId || ''}
                onChange={handleRegionChange}
                label="Región"
              >
                {regions.map((reg) => (
                  <MenuItem key={reg.id} value={reg.id}>
                    {reg.ordinal ? `${reg.ordinal} - ` : ''}{reg.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required disabled={!addressDetails.regionId}>
              <InputLabel>Comuna</InputLabel>
              <Select
                value={addressDetails.comunaId}
                label="Comuna"
                onChange={handleComunaChange}
              >
                {comunas.map((com) => (
                  <MenuItem key={com.id} value={com.id}>{com.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {selectedComunaData && (
            <Grid item xs={12}>
              <Alert 
                icon={<Truck size={20} />} 
                severity="info"
                sx={{ backgroundColor: 'white', border: '1px solid var(--info)', borderRadius: '12px' }}
              >
                <Typography variant="subtitle2" fontWeight="bold">Información de Envío (Por Pagar):</Typography>
                <Typography variant="body2">
                  El costo estimado hacia <strong>{selectedComunaData.name}</strong> es de aproximadamente <strong>${selectedComunaData.baseShippingPrice.toLocaleString()}</strong>.
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <Info size={14} style={{ marginRight: 4 }} /> 
                  El valor final es determinado por la empresa de transporte al momento del despacho.
                </Typography>
              </Alert>
            </Grid>
          )}

          <Grid item xs={12} sm={8}>
            <TextField
              label="Calle, Número, Depto"
              value={addressDetails.street}
              onChange={(e) => setAddressDetails(prev => ({...prev, street: e.target.value}))}
              required fullWidth variant="outlined" 
              placeholder="Ej: Av. Siempre Viva 742"
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Teléfono / Celular"
              value={addressDetails.phone}
              onChange={(e) => setAddressDetails(prev => ({...prev, phone: e.target.value}))}
              required fullWidth variant="outlined" 
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
          {isProcessing ? 'Procesando...' : 'Confirmar y Pagar'}
        </Button>
      </Box>
    </Box>
  );
};

export default Checkout;
