import { useLocation, useNavigate } from 'react-router-dom';
import { Fab, Badge, Zoom } from '@mui/material';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../hooks/cart/useCart.jsx';

const FloatingCartButton = () => {
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const totalItems = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  const isVisible = totalItems > 0 && location.pathname !== '/checkout';

  const handleClick = () => {
    navigate('/checkout');
  };

  return (
    <Zoom in={isVisible}>
      <Fab
        color="primary"
        aria-label="ver carrito"
        onClick={handleClick}
        sx={{
          position: 'fixed',
          bottom: { xs: 20, md: 30 },
          right: { xs: 20, md: 30 },
          zIndex: 1000,
          backgroundColor: 'var(--primary)',
          '&:hover': {
            backgroundColor: 'var(--primary-dark)',
            transform: 'scale(1.1)',
          },
          transition: 'transform 0.2s ease-in-out',
        }}
      >
        <Badge
          badgeContent={totalItems}
          color="error"
          max={99}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.9rem',
              fontWeight: 'bold',
            },
          }}
        >
          <ShoppingCart color="white" size={24} />
        </Badge>
      </Fab>
    </Zoom>
  );
};

export default FloatingCartButton;
