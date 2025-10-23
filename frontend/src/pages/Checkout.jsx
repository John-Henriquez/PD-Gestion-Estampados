
import React, { useState, useContext, useEffect } from 'react';
import { Box, Typography, TextField, Button, CircularProgress, Paper, Alert, Grid, Divider } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ImageUploader from '../components/ImageUploader.jsx';
import { createOrder } from '../services/order.service';
import { AuthContext } from '../context/AuthContext.jsx';
import { showSuccessAlert, showErrorAlert } from '../helpers/sweetAlert';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useContext(AuthContext);

  const [itemsToOrder, setItemsToOrder] = useState([]);
  const [customerData, setCustomerData] = useState({ name: '', email: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const itemsFromState = location.state?.items;
    if (Array.isArray(itemsFromState) && itemsFromState.length > 0) {
      setItemsToOrder(itemsFromState.map(item => ({
        ...item,
        stampImageUrl: null,
        stampInstructions: '',
      })));
    } else {
      console.warn("Checkout: No se recibieron items válidos. Usando item de prueba.");

      setItemsToOrder([
        {
          itemStockId: 5, 
          quantity: 1,
          stampImageUrl: null,
          stampInstructions: '',
          name: 'Producto de Prueba (Ajusta ID)', 
          price: 1000,
        }
      ]);
    }

    if (isAuthenticated && user) {
        setCustomerData({ name: user.nombreCompleto || '', email: user.email || '' });
    } else {
        setCustomerData({ name: '', email: '' }); 
    }
  }, [location.state, isAuthenticated, user]);

  const handleGuestDataChange = (event) => {
    setCustomerData(prev => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleInstructionsChange = (index, value) => {
    setItemsToOrder(prev => prev.map((item, i) => i === index ? { ...item, stampInstructions: value } : item));
  };

  const handleImageUploadSuccess = (index, imageUrl) => {
    setItemsToOrder(prev => prev.map((item, i) => i === index ? { ...item, stampImageUrl: imageUrl } : item));
  };

  const handleSubmitOrder = async () => {
    setError(null);
    if (!isAuthenticated && !customerData.email) {
      setError('Por favor, ingresa tu dirección de correo electrónico.');
      showErrorAlert('Datos incompletos', 'Ingresa tu correo electrónico para continuar.');
      return;
    }
    if (itemsToOrder.length === 0) {
        setError('No hay items en el pedido.');
        showErrorAlert('Pedido Vacío', 'No hay items para procesar.');
        return;
    }


    setIsProcessing(true);

    const orderPayload = {
      items: itemsToOrder.map(item => ({
        ...(item.itemStockId && { itemStockId: item.itemStockId }),
        ...(item.packId && { packId: item.packId }),
        quantity: Number(item.quantity) || 1,
        stampImageUrl: item.stampImageUrl,
        stampInstructions: item.stampInstructions,
      })),
      customerData: isAuthenticated ? null : customerData,
    };

    try {
      console.log('Enviando payload:', orderPayload);
      const createdOrder = await createOrder(orderPayload);
      setIsProcessing(false);
      showSuccessAlert('¡Pedido Creado!', `Tu pedido #${createdOrder.id} ha sido registrado.`);
      setItemsToOrder([]);
      navigate('/home'); 
    } catch (err) {
      setIsProcessing(false);
       let displayError = err.message || err.details || 'No se pudo crear el pedido.';
       if (err.message?.toLowerCase().includes('stock insuficiente')) {
            displayError = `Stock insuficiente. ${err.message}`;
       } else if (err.status === 400 && Array.isArray(err.details)) {
           displayError = `Datos inválidos: ${err.details.map(d => d.message).join('. ')}`;
       }
      setError(displayError);
      showErrorAlert('Error al Crear Pedido', displayError);
    }
  };

  const calculateTotal = () => {
    return itemsToOrder.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
  };


  if (itemsToOrder.length === 0 && location.state?.items) {
      return ( <Box sx={{ display: 'flex', justifyContent: 'center', p: 'var(--spacing-xl)' }}> <CircularProgress /> </Box> );
  }


  return (
    <Box sx={{ maxWidth: '900px', margin: 'var(--spacing-xl) auto', padding: 'var(--spacing-md)' }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'var(--primary-dark)', textAlign: 'center', mb: 'var(--spacing-lg)' }}>
        Finalizar Compra
      </Typography>

      {/* Resumen */}
      <Paper elevation={2} sx={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', backgroundColor: 'var(--gray-100)' }}>
        <Typography variant="h6" sx={{ color: 'var(--primary)', pb: 1, mb: 2, borderBottom: '1px solid var(--gray-300)' }}>
          Tu Pedido ({itemsToOrder.length} {itemsToOrder.length === 1 ? 'item' : 'items'})
        </Typography>

        {itemsToOrder.map((item, index) => (
          <React.Fragment key={item.itemStockId || `pack-${item.packId}-${index}`}>
            <Grid container spacing={3} sx={{ marginBottom: 'var(--spacing-md)' }}>
              {/* Columna Izquierda: Detalles + Instrucciones */}
              <Grid item xs={12} md={7}>
                 <Typography variant="subtitle1" fontWeight="bold">{item.name || `ID: ${item.itemStockId || item.packId}`}</Typography>
                 <Typography variant="body2" color="var(--gray-700)">Cantidad: {item.quantity}</Typography>
                 <Typography variant="body2" color="var(--gray-700)" sx={{ mb: 2 }}>
                   Precio Unitario: ${item.price?.toLocaleString() || 'N/A'}
                 </Typography>

                 <TextField
                    label="Instrucciones de Estampado"
                    value={item.stampInstructions}
                    onChange={(e) => handleInstructionsChange(index, e.target.value)}
                    multiline
                    rows={4}
                    fullWidth
                    margin="dense"
                    variant="outlined"
                    placeholder="Describe cómo quieres tu estampado (posición, tamaño, colores, etc.)"
                    InputLabelProps={{ shrink: true }}
                />
              </Grid>
              {/* Columna Derecha: Uploader */}
              <Grid item xs={12} md={5}>
                 <Typography variant="subtitle2" gutterBottom sx={{ color: 'var(--gray-900)' }}>
                   Imagen para Estampado:
                 </Typography>
                 <ImageUploader
                    key={`uploader-${item.itemStockId || item.packId}-${index}`}
                    onUploadSuccess={(imageUrl) => handleImageUploadSuccess(index, imageUrl)}
                 />
              </Grid>
            </Grid>
            {index < itemsToOrder.length - 1 && <Divider sx={{ my: 'var(--spacing-md)' }} />} {/* Separador */}
          </React.Fragment>
        ))}

         <Typography variant="h6" align="right" sx={{ mt: 2, color: 'var(--primary-dark)', fontWeight: 'bold' }}>
            Total: ${calculateTotal().toLocaleString()}
         </Typography>
      </Paper>

      {/* Datos Invitado */}
      {!isAuthenticated && (
        <Paper elevation={2} sx={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', backgroundColor: 'var(--gray-100)' }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'var(--primary)', pb: 1, mb: 1, borderBottom: '1px solid var(--gray-300)' }}>
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
        <Alert severity="error" sx={{ mb: 2 }}> {error} </Alert>
      )}

      {/* Botón Confirmar */}
      <Button
        variant="contained"
        onClick={handleSubmitOrder}
        disabled={isProcessing || itemsToOrder.length === 0}
        fullWidth
        size="large"
        className="animate--pulse" // Ejemplo de uso de animación
        sx={{
            padding: 'var(--spacing-sm) 0',
            backgroundColor: 'var(--success)',
            color: 'white',
            fontWeight: 600,
            fontSize: '1.1rem',
            borderRadius: 'var(--border-radius-md)',
            '&:hover': { backgroundColor: 'var(--success-dark)' },
            '&:disabled': { backgroundColor: 'var(--gray-300)', cursor: 'not-allowed' }
        }}
        startIcon={isProcessing ? <CircularProgress size={24} color="inherit" /> : null}
      >
        {isProcessing ? 'Procesando Pedido...' : 'Confirmar y Realizar Pedido'}
      </Button>
    </Box>
  );
};

export default Checkout;