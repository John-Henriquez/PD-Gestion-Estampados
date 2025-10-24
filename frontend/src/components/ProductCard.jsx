import { Card, CardContent, CardMedia, Typography, Button, Box, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { iconMap } from '../data/iconCategories'; 
import { COLOR_DICTIONARY } from '../data/colorDictionary';

import '../styles/components/productCard.css'

const getColorName = (hex) => {
    const color = COLOR_DICTIONARY.find(c => c.hex?.toUpperCase() === hex?.toUpperCase());
    return color ? color.name : hex; 
};

const ProductCard = ({ product }) => {
    const navigate = useNavigate();

    const { id, price, size, hexColor, itemType, quantity, productImageUrls } = product || {};
    const name = itemType?.name || 'Producto Desconocido';
    const iconName = itemType?.iconName;
    const IconComponent = iconName ? iconMap[iconName] : null;

    const backendUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

    const firstImageUrlRelative = (Array.isArray(productImageUrls) && productImageUrls.length > 0)
        ? productImageUrls[0]
        : null;
    const fullImageUrl = firstImageUrlRelative
        ? `${backendUrl.replace('/api', '')}${firstImageUrlRelative}`
        : null;

    const handleViewDetails = () => {
        navigate(`/product/${id}`); 
    };

    return (
        <Card className='product-card'>
            <CardMedia className="product-card__media" title={name}>
                {fullImageUrl ? (
                    <img src={fullImageUrl} alt={name} />
                ) : (
                    IconComponent
                        ? <IconComponent className="placeholder-icon" strokeWidth={1} />
                        : <Typography>Sin Imagen</Typography>
                )}
            </CardMedia>

            <CardContent className="product-card__content">
                <Box className="product-card__details">
                    <Typography gutterBottom variant="h6" component="div" className="product-card__name">
                        {name}
                    </Typography>

                    <Box className="product-card__info">
                        <Typography variant="body2" color="text.secondary">
                            Color: {getColorName(hexColor)}
                        </Typography>
                        {hexColor && (
                            <Box className="product-card__color-swatch" sx={{ backgroundColor: hexColor }} />
                        )}
                        {size && (
                             <Chip label={`Talla: ${size}`} size="small" className="product-card__size-chip" />
                        )}
                    </Box>

                    <Typography variant="h6" className="product-card__price">
                        ${price?.toLocaleString() || 'N/A'}
                    </Typography>

                    <Typography variant="caption" className="product-card__stock-status"
                        sx={{ color: quantity === 0 ? 'var(--error)' : (quantity <= 5 ? 'var(--warning)' : 'transparent') }}>
                        {quantity === 0 ? 'Agotado' : (quantity <= 5 ? '¡Últimas unidades!' : '')}
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    fullWidth
                    onClick={handleViewDetails}
                    disabled={quantity === 0}
                    className="product-card__button" 
                >
                    Ver Detalles
                </Button>
            </CardContent>
        </Card>
    );
};

export default ProductCard;