import { useAuth } from '../context/AuthContext.jsx'; // Use useAuth instead of AuthContext
import { Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';

const Home = () => {
  const { isAuthenticated, user } = useAuth(); // Access context via useAuth

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        px: 2,
      }}
    >
      <Typography variant="h3" gutterBottom>
        Bienvenido al Sistema de Inventario
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        {isAuthenticated
          ? `Hola, ${user?.nombreCompleto || 'Usuario'}. Gestiona tu inventario con facilidad.`
          : 'Por favor, inicia sesión para acceder al sistema.'}
      </Typography>
      {isAuthenticated && user?.rol === 'administrador' && (
        <Button component={Link} to="/inventario" variant="contained" color="primary" size="large">
          Ir al Inventario
        </Button>
      )}
      {!isAuthenticated && (
        <Button component={Link} to="/auth" variant="contained" color="primary" size="large">
          Iniciar Sesión
        </Button>
      )}
    </Box>
  );
};

export default Home;
