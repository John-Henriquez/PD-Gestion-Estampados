import { Card, CardContent, CardMedia, Typography, Button, Box, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import '../../styles/components/productCard.css';

const PackCard = ({ pack }) => {
  const navigate = useNavigate();
  const { id, name, price, discount, packItems } = pack;

  const backendUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

  let displayImage = null;
  if (packItems && packItems.length > 0) {
    const firstItem = packItems[0].itemStock?.itemType;
    if (firstItem?.productImageUrls?.length > 0) {
      displayImage = `${backendUrl.replace('/api', '')}${firstItem.productImageUrls[0]}`;
    }
  }

  const handleViewDetails = () => {
    navigate(`/pack/${id}`);
  };

  return (
    <Card className="product-card" sx={{ position: 'relative' }}>
      {discount > 0 && (
        <Chip
          label={`${(discount * 100).toFixed(0)}% OFF`}
          color="secondary"
          size="small"
          sx={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}
        />
      )}

      <CardMedia className="product-card__media" title={name}>
        {displayImage ? (
          <img src={displayImage} alt={name} />
        ) : (
          <Package size={64} className="placeholder-icon" strokeWidth={1} />
        )}
      </CardMedia>

      <CardContent className="product-card__content">
        <Box className="product-card__details">
          <Typography gutterBottom variant="h6" component="div" className="product-card__name">
            {name}
          </Typography>

          <Box className="product-card__info">
            <Typography variant="body2" color="text.secondary">
              Contiene {packItems?.length || 0} productos
            </Typography>
          </Box>

          <Typography variant="h6" className="product-card__price">
            ${price.toLocaleString()}
          </Typography>

          <Typography
            variant="caption"
            className="product-card__stock-status"
            sx={{ color: 'var(--success)' }}
          >
            Pack Disponible
          </Typography>
        </Box>

        <Button
          variant="contained"
          fullWidth
          onClick={handleViewDetails}
          className="product-card__button"
          sx={{
            backgroundColor: 'var(--secondary)',
            '&:hover': { backgroundColor: 'var(--secondary-dark)' },
          }}
        >
          Ver Pack
        </Button>
      </CardContent>
    </Card>
  );
};

export default PackCard;
