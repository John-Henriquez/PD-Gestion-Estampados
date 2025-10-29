import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Alert, Chip, TextField, IconButton, Divider, Grid, FormControl, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getItemStockById } from '../services/itemStock.service';
import ImageUploader from '../components/ImageUploader.jsx';
import { iconMap } from '../data/iconCategories';
import { COLOR_DICTIONARY } from '../data/colorDictionary';
import { useCart } from '../context/CartContext.jsx';
import { showSuccessAlert, showErrorAlert } from '../helpers/sweetAlert';

import '../styles/pages/productDetail.css';

const getColorName = (hex) => {
    const color = COLOR_DICTIONARY.find(c => c.hex?.toUpperCase() === hex?.toUpperCase());
    return color ? color.name : hex;
};

const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const backendUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
    return `${backendUrl.replace('/api', '')}${url}`;
};

const StampOptionsSelector = ({ itemTypeOptions, stockPricing, selectedOptions, onChange }) => {
    if (!itemTypeOptions || (!itemTypeOptions.locations && !itemTypeOptions.types)) {
        return null; 
    }

    const handleLocationChange = (event) => {
        onChange({ ...selectedOptions, location: event.target.value || null });
    };

    const handleTypeChange = (event) => {
         onChange({ ...selectedOptions, type: event.target.value || null });
    };

    const getLocationCost = (location) => stockPricing?.locations?.[location] || 0;
    const getTypeCost = (type) => stockPricing?.types?.[type] || 0;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, mb: 2, p: 2, border: '1px solid var(--gray-300)', borderRadius: 'var(--border-radius-sm)', backgroundColor: 'var(--gray-100)' }}>
            {itemTypeOptions.locations && itemTypeOptions.locations.length > 0 && (
                <FormControl component="fieldset">
                    <Typography variant="subtitle2" gutterBottom component="legend">Ubicación del Estampado:</Typography>
                    <RadioGroup
                        row
                        aria-label="stamp-location"
                        name="stamp-location"
                        value={selectedOptions.location || ''}
                        onChange={handleLocationChange}
                    >
                        {itemTypeOptions.locations.map(loc => (
                            <FormControlLabel
                                key={loc}
                                value={loc}
                                control={<Radio />}
                                label={`${loc.charAt(0).toUpperCase() + loc.slice(1)} (+${(getLocationCost(loc) || 0).toLocaleString()})`}
                            />
                        ))}
                         {/* Opción para "Ninguno" o deseleccionar */}
                         <FormControlLabel value="" control={<Radio />} label="Ninguno" />
                    </RadioGroup>
                </FormControl>
            )}

            {itemTypeOptions.types && itemTypeOptions.types.length > 0 && (
                 <FormControl component="fieldset">
                    <Typography variant="subtitle2" gutterBottom component="legend">Tipo de Estampado:</Typography>
                     <RadioGroup
                         row
                         aria-label="stamp-type"
                         name="stamp-type"
                         value={selectedOptions.type || ''}
                         onChange={handleTypeChange}
                     >
                         {itemTypeOptions.types.map(type => (
                             <FormControlLabel
                                 key={type}
                                 value={type}
                                 control={<Radio />}
                                 label={`${type.toUpperCase()} (+${(getTypeCost(type) || 0).toLocaleString()})`}
                             />
                         ))}
                          <FormControlLabel value="" control={<Radio />} label="Ninguno" />
                     </RadioGroup>
                 </FormControl>
            )}
        </Box>
    );
};

const ProductDetail = () => {
    const { itemStockId } = useParams(); 
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1); 
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const [stampImageUrl, setStampImageUrl] = useState(null); 
    const [stampInstructions, setStampInstructions] = useState('');

    const [selectedStampOptions, setSelectedStampOptions] = useState({ location: null, type: null });

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getItemStockById(itemStockId); 
                setProduct(data);
                setCurrentImageIndex(0);
                setStampImageUrl(null);
                setStampInstructions('');
                setSelectedStampOptions({ location: null, type: null });
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

    const calculateDynamicPrice = useCallback(() => {
        if (!product) return 0;
        let currentPrice = product.price || 0; // Precio base

        if (product.stampOptionsPricing && selectedStampOptions) {
            // Sumar costo de ubicación
            if (selectedStampOptions.location && product.stampOptionsPricing.locations) {
                currentPrice += product.stampOptionsPricing.locations[selectedStampOptions.location] || 0;
            }
            // Sumar costo de tipo
             if (selectedStampOptions.type && product.stampOptionsPricing.types) {
                currentPrice += product.stampOptionsPricing.types[selectedStampOptions.type] || 0;
            }
        }
        return currentPrice;
    }, [product, selectedStampOptions]);

    // --- useMemo para el precio total del item (precio dinámico * cantidad) ---
    const totalItemPrice = useMemo(() => {
        return calculateDynamicPrice() * quantity;
    }, [calculateDynamicPrice, quantity]);

    const handleQuantityChange = (amount) => {
        setQuantity(prev => {
            const newQuantity = prev + amount;
            if (newQuantity < 1) return 1; 
            if (product && newQuantity > product.quantity) return product.quantity; 
            return newQuantity;
        });
    };

    const handleAddToCartAndCheckout = () => {
        if (!product) return;

        const isStampable = product.itemType?.category === 'clothing' || product.itemType?.category === 'object';
        if (isStampable && !stampImageUrl) {
            showErrorAlert("Falta Imagen", "Por favor, sube la imagen que deseas estampar antes de continuar.");
            return;
        }

        if (isStampable && product.itemType?.stampOptions && (!selectedStampOptions.location && !selectedStampOptions.type)) {
            console.log("No se seleccionaron opciones de estampado, se usará precio base.");
            showErrorAlert("Faltan Opciones", "Por favor, selecciona las opciones de estampado."); return;
         }

         const calculatedPrice = calculateDynamicPrice();

        const itemToAdd = {
            itemStockId: product.id,
            quantity: quantity,
            name: product.itemType?.name || 'Producto',
            price: calculatedPrice,
            selectedStampOptions: isStampable ? selectedStampOptions : null,
            ...(isStampable && {
                stampImageUrl: stampImageUrl,
                stampInstructions: stampInstructions,
            }),
            hexColor: product.hexColor,
            size: product.size,
            productImageUrls: product.productImageUrls 
        };

        addToCart(itemToAdd); 
        showSuccessAlert('¡Añadido!', `${itemToAdd.name} fue añadido al carrito.`);
        navigate('/checkout');
    };

    const handlePrevImage = () => {
        setCurrentImageIndex(prev => (prev === 0 ? (product.productImageUrls.length - 1) : prev - 1));
    };

    const handleNextImage = () => {
        setCurrentImageIndex(prev => (prev === (product.productImageUrls.length - 1) ? 0 : prev + 1));
    };

    const handleStampImageUploadSuccess = (uploadedUrl) => {
        setStampImageUrl(uploadedUrl); 
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

    const { size, hexColor, itemType, productImageUrls = [] } = product;
    const basePrice = product.price;
    const name = itemType?.name || 'Producto Desconocido';
    const description = itemType?.description || 'Sin descripción.'; 
    const iconName = itemType?.iconName;
    const IconComponent = iconName ? iconMap[iconName] : null;
    const currentImageUrl = productImageUrls.length > 0 ? getFullImageUrl(productImageUrls[currentImageIndex]) : null;
    const hasMultipleImages = productImageUrls.length > 1;

    const isStampable = itemType?.category === 'clothing' || itemType?.category === 'object';
    const hasStampOptionsConfigured = isStampable && itemType?.stampOptions && (itemType.stampOptions.locations?.length > 0 || itemType.stampOptions.types?.length > 0);

    return (
        <div className="product-detail-container">
            <div className="product-detail-grid">
                <section className="product-image-section">
                    {/* Galería de imagenes*/}
                    {currentImageUrl ? (
                        <img src={currentImageUrl} alt={`${name} - Imagen ${currentImageIndex + 1}`} loading="lazy"/>) 
                        : ( IconComponent
                            ? <IconComponent size={128} strokeWidth={1} className="product-image-placeholder"/>
                            : <Typography className="product-image-placeholder">Sin Imagen</Typography>
                    )}
                    {/* Controles de Navegación (si hay múltiples imágenes) */}
                    {hasMultipleImages && (
                        <Box sx={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 1, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '20px', padding: '4px 8px' }}>
                            <IconButton onClick={handlePrevImage} size="small" sx={{ color: 'white' }}> <ChevronLeft /> </IconButton>
                            <Typography sx={{ color: 'white', alignSelf: 'center', fontSize: '0.9rem' }}>
                                {currentImageIndex + 1} / {productImageUrls.length}
                            </Typography>
                            <IconButton onClick={handleNextImage} size="small" sx={{ color: 'white' }}> <ChevronRight /> </IconButton>
                        </Box>
                    )}
                </section>

                <section className="product-info-section">
                    <Typography component="h1" className="product-info__name">{name}</Typography>
                    <Typography className="product-info__description">{description}</Typography>

                    <Typography className="product-info__price">
                         ${(calculateDynamicPrice() || 0).toLocaleString()} {/* Mostrar precio unitario calculado */}
                         {basePrice !== calculateDynamicPrice() && (
                             <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary', textDecoration: 'line-through' }}>
                                 Base: ${basePrice?.toLocaleString()}
                             </Typography>
                         )}
                    </Typography>

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

                    {isStampable && (
                        <Box className="product-customization-section" sx={{ my: 'var(--spacing-lg)' }}>
                            <Divider sx={{ mb: 'var(--spacing-md)' }} />
                            <Typography variant="h6" gutterBottom sx={{ color: 'var(--secondary-dark)'}}>Personaliza tu Estampado</Typography>
                            {hasStampOptionsConfigured && (
                                 <StampOptionsSelector
                                     itemTypeOptions={itemType.stampOptions}
                                     stockPricing={product.stampOptionsPricing}
                                     selectedOptions={selectedStampOptions}
                                     onChange={setSelectedStampOptions}
                                 />
                             )}
                            <Grid container spacing={2}>
                                {/* Uploader Imagen Estampado */}
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" gutterBottom>Tu Imagen:</Typography>
                                    <ImageUploader onUploadSuccess={handleStampImageUploadSuccess} />
                                </Grid>
                                {/* Campo Instrucciones */}
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" gutterBottom>Instrucciones:</Typography>
                                    <TextField
                                        label="Detalles del estampado"
                                        multiline
                                        rows={hasStampOptionsConfigured ? 2 : 4}
                                        fullWidth
                                        value={stampInstructions}
                                        onChange={(e) => setStampInstructions(e.target.value)}
                                        placeholder="Ej: Posición (pecho, espalda), tamaño (10cm), colores..."
                                        variant="outlined"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                            </Grid>
                            <Divider sx={{ mt: 'var(--spacing-md)' }} />
                        </Box>
                    )}

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

                        <Typography variant="h6" sx={{ textAlign: 'right', my: 1 }}>
                            Total Item: ${(totalItemPrice || 0).toLocaleString()}
                         </Typography>

                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleAddToCartAndCheckout}
                            disabled={product.quantity === 0}
                            className="add-to-cart-button animate--pulse"
                        >
                            {isStampable ? 'Añadir Personalización y Comprar' : 'Añadir al Carrito y Comprar'}
                        </Button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ProductDetail;