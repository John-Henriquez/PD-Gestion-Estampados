import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Alert, Chip, TextField } from '@mui/material';
import { getItemStockById } from '../services/itemStock.service';
import { iconMap } from '../data/iconCategories';
import { COLOR_DICTIONARY } from '../data/colorDictionary';

import '../styles/pages/productDetail.css';

const getColorName = (hex) => {
    const color = COLOR_DICTIONARY.find(c => c.hex?.toUpperCase() === hex?.toUpperCase());
    return color ? color.name : hex;
};

const ProductDetail = () => {
    const { itemStockId } = useParams(); 
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1); 

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getItemStockById(itemStockId); 
                setProduct(data);
            } catch (err) {
                console.error("Error al cargar detalle del producto:", err);
                setError(err.message || 'No se pudo cargar el producto.');
            } finally {
                setLoading(false);
            }
        };

        if (itemStockId) {
            fetchProduct();
        }
    }, [itemStockId]); 

    const handleQuantityChange = (amount) => {
        setQuantity(prev => {
            const newQuantity = prev + amount;
            if (newQuantity < 1) return 1; 
            if (product && newQuantity > product.quantity) return product.quantity; 
            return newQuantity;
        });
    };

    const handleProceedToCheckout = () => {
        if (!product) return;

        const itemToCheckout = {
            itemStockId: product.id,
            quantity: quantity,
            name: product.itemType?.name || 'Producto',
            price: product.price,
        };

        navigate('/checkout', { state: { items: [itemToCheckout] } });
    };

    if (loading) {
        return <Box className="shop-loading-container"><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="error" className="shop-error-alert">{error}</Alert>;
    }

    if (!product) {
        return <Typography className="shop-empty-message">Producto no encontrado.</Typography>;
    }

    const { price, size, hexColor, itemType } = product;
    const name = itemType?.name || 'Producto Desconocido';
    const description = itemType?.description || 'Sin descripción.'; // Usar descripción del itemType
    const iconName = itemType?.iconName;
    const IconComponent = iconName ? iconMap[iconName] : null;

    const imageUrl = null;

    return (
        <div className="product-detail-container">
            <div className="product-detail-grid">
                <section className="product-image-section">
                    {imageUrl ? (
                        <img src={imageUrl} alt={name} />
                    ) : (
                        IconComponent
                            ? <IconComponent size={128} strokeWidth={1} className="product-image-placeholder"/>
                            : <Typography className="product-image-placeholder">Sin Imagen</Typography>
                    )}
                </section>

                <section className="product-info-section">
                    <Typography component="h1" className="product-info__name">{name}</Typography>
                    <Typography className="product-info__description">{description}</Typography>
                    <Typography className="product-info__price">${price?.toLocaleString() || 'N/A'}</Typography>

                    <div className="product-info__details">
                        <div className="product-info__detail-item">
                            <Typography component="span" fontWeight="bold">Color:</Typography>
                            <Typography component="span">{getColorName(hexColor)}</Typography>
                            {hexColor && <Box className="product-info__color-swatch" sx={{ backgroundColor: hexColor }} />}
                        </div>
                        {size && (
                            <div className="product-info__detail-item">
                                <Typography component="span" fontWeight="bold">Talla:</Typography>
                                <Chip label={size} size="small" />
                            </div>
                        )}
                         <div className="product-info__detail-item">
                            <Typography component="span" fontWeight="bold">Disponibilidad:</Typography>
                            <Typography component="span">{product.quantity > 0 ? `${product.quantity} en stock` : 'Agotado'}</Typography>
                        </div>
                    </div>

                    <div className="product-actions">
                        <Box className="quantity-selector">
                             <Typography fontWeight="bold">Cantidad:</Typography>
                             <Button
                                 variant="outlined"
                                 onClick={() => handleQuantityChange(-1)}
                                 disabled={quantity <= 1}
                                 className="quantity-selector__button"
                             >
                               -
                             </Button>
                             <TextField
                                type="number"
                                value={quantity}
                                InputProps={{ readOnly: true }}
                                className="quantity-selector__input"
                             />
                             <Button
                                 variant="outlined"
                                 onClick={() => handleQuantityChange(1)}
                                 disabled={quantity >= product.quantity}
                                 className="quantity-selector__button"
                             >
                               +
                             </Button>
                        </Box>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleProceedToCheckout}
                            disabled={product.quantity === 0}
                            className="add-to-cart-button animate--pulse"
                        >
                            Personalizar y Comprar
                        </Button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ProductDetail;