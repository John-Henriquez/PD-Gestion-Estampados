import { Card, CardContent, CardMedia, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { iconMap } from '../../data/iconCategories';

import '../../styles/components/productCard.css';

const ProductCard = ({ itemType }) => {
  const navigate = useNavigate();

  const { id: typeId, name, productImageUrls, hasSizes, stampingLevels } = itemType || {};

  const iconName = itemType?.iconName;
  const IconComponent = iconName ? iconMap[iconName] : null;

  const backendUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

  const firstImageUrlRelative =
    Array.isArray(productImageUrls) && productImageUrls.length > 0 ? productImageUrls[0] : null;
  const fullImageUrl = firstImageUrlRelative
    ? `${backendUrl.replace('/api', '')}${firstImageUrlRelative}`
    : null;

  const handleViewDetails = () => {
    navigate(`/product/${typeId}`);
  };

  const prices = Array.isArray(stampingLevels)
    ? stampingLevels.map((level) => level.price).filter(Boolean)
    : [];

  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

  const displayPrice =
    minPrice !== null
      ? minPrice === maxPrice
        ? `$${minPrice.toLocaleString()}`
        : `$${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}`
      : 'N/A';

  const hasStock = true;

  return (
    <Card className="product-card">
      <CardMedia className="product-card__media" title={name}>
        {fullImageUrl ? (
          <img src={fullImageUrl} alt={name} />
        ) : IconComponent ? (
          <IconComponent className="placeholder-icon" strokeWidth={1} />
        ) : (
          <Typography>Sin Imagen</Typography>
        )}
      </CardMedia>

      <CardContent className="product-card__content">
        <Box className="product-card__details">
          <Typography gutterBottom variant="h6" component="div" className="product-card__name">
            {name}
          </Typography>

          <Box className="product-card__info">
            <Typography variant="body2" color="text.secondary">
              {hasSizes ? 'Varias tallas y colores' : 'Talla única y varios colores'}
            </Typography>
          </Box>

          <Typography variant="h6" className="product-card__price">
            {displayPrice}
          </Typography>

          <Typography
            variant="caption"
            className="product-card__stock-status"
            sx={{
              color: hasStock ? 'var(--success)' : 'var(--error)',
            }}
          >
            {hasStock ? 'Disponible' : 'Agotado'}
          </Typography>
        </Box>

        <Button
          variant="contained"
          fullWidth
          onClick={handleViewDetails}
          disabled={!hasStock}
          className="product-card__button"
        >
          Ver Detalles
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
