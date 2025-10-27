import { useContext } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Button, Paper } from '@mui/material';
import { CheckCircle } from 'lucide-react'; 
import { AuthContext } from '../context/AuthContext.jsx'; 
// Opcional: Crear y usar '../styles/pages/orderConfirmation.css'

const OrderConfirmation = () => {
  const { orderId } = useParams(); 
  const { isAuthenticated } = useContext(AuthContext); 

  return (
    <Box sx={{
        maxWidth: '600px',
        margin: 'var(--spacing-xl) auto',
        padding: 'var(--spacing-md)',
        paddingTop: 'calc(4.5rem + var(--spacing-lg))', 
        textAlign: 'center'
     }}>
      <Paper elevation={3} sx={{ padding: 'var(--spacing-lg)', backgroundColor: 'var(--gray-100)' }}>
        <CheckCircle size={64} color="var(--success)" style={{ marginBottom: 'var(--spacing-md)' }} />
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'var(--primary-dark)' }}>
          ¡Pedido Recibido!
        </Typography>
        <Typography variant="body1" sx={{ mb: 'var(--spacing-lg)' }}>
          Gracias por tu compra. Tu pedido con el número <strong>#{orderId}</strong> ha sido registrado exitosamente.
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 'var(--spacing-xl)' }}>
          Recibirás una confirmación por correo electrónico pronto. Puedes revisar el estado de tus pedidos en tu cuenta.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
          {/* Botón "Mis Pedidos" (solo si está logueado) */}
          {isAuthenticated && (
            <Button
              variant="contained"
              component={RouterLink}
              to="/my-orders" // Enlace a la página de historial (Sprint 5)
              sx={{ backgroundColor: 'var(--primary)', '&:hover': { backgroundColor: 'var(--primary-dark)' } }}
            >
              Ver Mis Pedidos
            </Button>
          )}
          {/* Botón "Volver a la Tienda" */}
          <Button
            variant="outlined"
            component={RouterLink}
            to="/shop" // Enlace a la tienda
            sx={{ borderColor: 'var(--primary)', color: 'var(--primary)', '&:hover': { borderColor: 'var(--primary-dark)', backgroundColor: 'rgba(123, 44, 191, 0.04)' } }}

          >
            Volver a la Tienda
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default OrderConfirmation;