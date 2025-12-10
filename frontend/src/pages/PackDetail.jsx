import { useState, useEffect, useMemo } from 'react';
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
  IconButton,
} from '@mui/material';
import { Check, Package, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPackById } from '../services/pack.service';
import { useCart } from '../hooks/cart/useCart.jsx';
import { showSuccessAlert } from '../helpers/sweetAlert';
import '../styles/pages/productDetail.css';

const getFullImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const backendUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
  return `${backendUrl.replace('/api', '')}${url}`;
};

const PackDetail = () => {
  const { packId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const packImages = useMemo(() => {
    if (!pack) return [];
    // Flatten para unir todas las imágenes de todos los items en un solo array
    const images = pack.packItems.flatMap((pi) => {
      const urls = pi.itemStock.itemType.productImageUrls || [];
      const itemName = pi.itemStock.itemType.name;
      const itemColor = pi.itemStock.hexColor;

      if (urls.length > 0) {
        // Si el item tiene fotos, las agregamos
        return urls.map((url) => ({
          type: 'image',
          src: url,
          alt: itemName,
          color: itemColor,
        }));
      } else {
        return [
          {
            type: 'color',
            src: null,
            alt: itemName,
            color: itemColor,
          },
        ];
      }
    });

    return images;
  }, [pack]);

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % packImages.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + packImages.length) % packImages.length);
  };

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

  const currentMedia = packImages[currentImageIndex];

  return (
    <div className="product-detail-container">
      <div className="product-detail-grid">
        {/* Columna Izquierda: Carrusel de Imágenes Heredadas */}
        <div className="product-image-column">
          <section
            className="product-image-section"
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            {packImages.length > 0 ? (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {currentMedia.type === 'image' ? (
                  // Muestra la FOTO del ítem
                  <img
                    src={getFullImageUrl(currentMedia.src)}
                    alt={currentMedia.alt}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '400px',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                ) : (
                  // Fallback a COLOR si no tiene foto
                  <div
                    style={{
                      width: 200,
                      height: 200,
                      borderRadius: '50%',
                      backgroundColor: currentMedia.color,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                      fontWeight: 'bold',
                    }}
                  >
                    {currentMedia.alt}
                  </div>
                )}

                {/* Texto indicador de qué producto es */}
                <Typography
                  variant="subtitle1"
                  sx={{ mt: 2, fontWeight: 500, color: 'text.secondary' }}
                >
                  {currentMedia.alt}
                </Typography>

                {/* Controles de Navegación (Solo si hay más de 1 imagen) */}
                {packImages.length > 1 && (
                  <>
                    <IconButton
                      onClick={handlePrevImage}
                      sx={{
                        position: 'absolute',
                        left: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'rgba(255,255,255,0.8)',
                        '&:hover': { bgcolor: 'white' },
                      }}
                    >
                      <ChevronLeft />
                    </IconButton>
                    <IconButton
                      onClick={handleNextImage}
                      sx={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'rgba(255,255,255,0.8)',
                        '&:hover': { bgcolor: 'white' },
                      }}
                    >
                      <ChevronRight />
                    </IconButton>
                    {/* Indicador de número */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 10,
                        right: 10,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '0.8rem',
                      }}
                    >
                      {currentImageIndex + 1} / {packImages.length}
                    </Box>
                  </>
                )}
              </Box>
            ) : (
              // Fallback si el pack está vacío
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
                <Package size={120} color="var(--primary)" strokeWidth={1} />
                <Typography variant="caption" sx={{ mt: 2, color: 'text.secondary' }}>
                  Pack Promocional
                </Typography>
              </Box>
            )}
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
