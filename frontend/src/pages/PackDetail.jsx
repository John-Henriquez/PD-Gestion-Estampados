import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
} from '@mui/material';
import { Check, Package, ShoppingCart } from 'lucide-react';
import { getPackById } from '../services/pack.service';
import { useCart } from '../hooks/cart/useCart.jsx';
import { showSuccessAlert } from '../helpers/sweetAlert';
import '../styles/pages/productDetail.css';

const PackDetail = () => {
  const { packId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPackData = async () => {
      try {
        setLoading(true);
        const data = await getPackById(packId);
        if (!data) throw new Error('Pack no encontrado');
        setPack(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPackData();
  }, [packId]);

  const handleAddToCart = () => {
    if (!pack) return;

    const itemToAdd = {
      packId: pack.id,
      name: `Pack: ${pack.name}`,
      price: pack.price,
      quantity: 1,
      stampImageUrl: null,
      isPack: true,
    };

    addToCart(itemToAdd);
    showSuccessAlert('¡Añadido!', `${pack.name} fue añadido al carrito.`);
    navigate('/checkout');
  };

  if (loading) return;
  <Box className="shop-loading-container">
    <CircularProgress />
  </Box>;
  if (error) return;
  <Alert severity="error" className="shop-error-alert">
    {error}
  </Alert>;
  if (!pack) return null;

  return (
    <div className="product-detail-container">
      <div className="product-detail-grid">
        {/* Columna Izquierda: Información Visual */}
        <div className="product-image-column">
          <section className="product-image-section" style={{ backgroundColor: '#f0f0f0' }}>
            <Package size={120} color="var(--primary)" strokeWidth={1} />
            <Typography variant="caption" sx={{ mt: 2, color: 'text.secondary' }}>
              Pack Promocional
            </Typography>
          </section>
        </div>

        {/* Columna Derecha: Detalles y Acción */}
        <section className="product-info-section">
          <Typography component="h1" className="product-info__name">
            {pack.name}
          </Typography>

          <Typography className="product-info__description">
            {pack.description || 'Sin descripción disponible.'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 3 }}>
            <Typography className="product-info__price" sx={{ mb: 0 }}>
              ${pack.price.toLocaleString()}
            </Typography>
            {pack.discount > 0 && (
              <Typography variant="body1" color="success.main" fontWeight="bold">
                {Math.round(pack.discount * 100)}% de Descuento incluido
              </Typography>
            )}
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="h6" gutterBottom>
            Contenido del Pack:
          </Typography>
          <Paper variant="outlined" sx={{ mb: 3, bgcolor: 'var(--gray-100)' }}>
            <List dense>
              {pack.packItems.map((pi) => (
                <ListItem key={pi.id}>
                  <ListItemIcon style={{ minWidth: 36 }}>
                    <Check size={18} color="var(--success)" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${pi.itemStock.itemType.name} (x${pi.quantity})`}
                    secondary={
                      <span>
                        {pi.itemStock.size && `Talla: ${pi.itemStock.size} • `}
                        Color:
                        <span
                          style={{
                            display: 'inline-block',
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            backgroundColor: pi.itemStock.hexColor,
                            border: '1px solid #ccc',
                          }}
                        ></span>
                      </span>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          <div className="product-actions">
            <Button
              variant="contained"
              size="large"
              onClick={handleAddToCart}
              startIcon={<ShoppingCart />}
              className="add-to-cart-button animate--pulse"
              sx={{
                backgroundColor: 'var(--secondary) !important',
                '&:hover': { backgroundColor: 'var(--secondary-dark) !important' },
              }}
            >
              Comprar Pack
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PackDetail;
