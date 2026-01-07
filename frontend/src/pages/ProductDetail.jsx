import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import {
  Box, Tooltip, Typography, Button, CircularProgress, Alert, Chip,
  TextField, IconButton, Divider, Grid, FormControl,
  RadioGroup, FormControlLabel, Radio, ToggleButtonGroup, ToggleButton, Paper,
} from '@mui/material';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

import { getItemTypeById } from '../services/itemType.service';
import { getPublicItemStock } from '../services/itemStock.service';

import ImageUploader from '../components/UI/ImageUploader.jsx';
import { iconMap } from '../data/iconCategories';
import { useCart } from '../hooks/cart/useCart.jsx';
import { formatCLP } from '../helpers/formatData';
import { showSuccessAlert, showErrorAlert } from '../helpers/sweetAlert';

import '../styles/pages/productDetail.css';

const getFullImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const backendUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
  return `${backendUrl.replace('/api', '')}${url}`;
};

const ProductDetail = () => {
  const { itemTypeId } = useParams();
  const navigate = useNavigate();
  const { addToCart, removeFromCart } = useCart();

  const [itemType, setItemType] = useState(null);
  const [allStockVariations, setAllStockVariations] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSize, setSelectedSize] = useState('');

  const [selectedColorObj, setSelectedColorObj] = useState(null); 
  const [availableColors, setAvailableColors] = useState([]);

  const [selectedLevelName, setSelectedLevelName] = useState(null);

  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [stampImageUrl, setStampImageUrl] = useState(null);
  const [stampInstructions, setStampInstructions] = useState('');

  const location = useLocation();

  const editItem = location.state?.editItem || null;

 const realAvailableSizes = useMemo(() => {
  if (allStockVariations.length === 0) return [];
  
  const sizes = allStockVariations
    .filter(stock => stock.quantity > 0)
    .map(stock => stock.size);
    
  return [...new Set(sizes)];
}, [allStockVariations]);

  //  EFECTO 1: Cargar datos iniciales del TIPO y todas sus variaciones
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const typeInfo = await getItemTypeById(itemTypeId);
        setItemType(typeInfo);

        const stockVariations = await getPublicItemStock({ itemTypeId });
        setAllStockVariations(stockVariations || []);

        const firstAvailableSize = stockVariations.find(s => s.quantity > 0)?.size;
        if (firstAvailableSize) {
          setSelectedSize(firstAvailableSize);
        }

        if (!editItem) {
          const firstAvailableSize = stockVariations.find(s => s.quantity > 0)?.size;
          setSelectedSize(firstAvailableSize || (typeInfo?.hasSizes ? typeInfo.sizesAvailable[0] : null));
          setQuantity(1);
          setStampImageUrl(null);
          setStampInstructions('');
        }

        setError(null);

        if (!typeInfo) {
          throw new Error('Producto no encontrado.');
        }

        if (typeInfo.hasSizes && typeInfo.sizesAvailable?.length > 0) {
          setSelectedSize(typeInfo.sizesAvailable[0]);
        } else {
          setSelectedSize(null);
        }
        setCurrentImageIndex(0);
        setStampImageUrl(null);
        setStampInstructions('');
        setQuantity(1);
      } catch (err) {
        setError(err.message || 'No se pudo cargar el producto.');
      } finally {
        setLoading(false);
      }
    };
    fetchProductData();
  }, [itemTypeId, editItem]);

  // EFECTO 2: Actualizar colores disponibles cuando cambia la talla seleccionada
  useEffect(() => {
    if (allStockVariations.length === 0) return;
    
    const stocksForSize = allStockVariations.filter((stock) => stock.size === selectedSize);

    const uniqueColors = [];
    const map = new Map();
    for (const stock of stocksForSize) {
      if (stock.color && !map.has(stock.color.id)) {
        map.set(stock.color.id, true);
        uniqueColors.push(stock.color);
      }
    }
    
    setAvailableColors(uniqueColors);

    if (!editItem || (editItem && selectedSize !== editItem.size)) {
      if (uniqueColors.length > 0) setSelectedColorObj(uniqueColors[0]);
    }
    
  }, [selectedSize, allStockVariations, editItem]);

  // EFECTO 3: Encontrar el stock exacto cuando cambia la talla O el color
  useEffect(() => {
    if (!selectedColorObj) {
      setSelectedStock(null);
      return;
    }
    
    const matchingStock = allStockVariations.find(
      (stock) => stock.size === selectedSize && stock.color?.id === selectedColorObj.id
    );

    setSelectedStock(matchingStock || null);
    setQuantity(1);
  }, [selectedColorObj, selectedSize, allStockVariations]);

  // EFECTO 4: Inyectar datos si es una edición
  useEffect(() => {
    if (editItem && itemType && allStockVariations.length > 0) {
      setSelectedSize(editItem.size);
      
      const matchingStock = allStockVariations.find(s => s.id === editItem.itemStockId);
      if (matchingStock) {
        setSelectedColorObj(matchingStock.color);
      }
      if (editItem.stampOptionsSnapshot) {
        setSelectedLevelName(editItem.stampOptionsSnapshot.level);
      }
      setStampImageUrl(editItem.stampImageUrl);
      setStampInstructions(editItem.stampInstructions || '');
      setQuantity(editItem.quantity);
    }
  }, [editItem, itemType, allStockVariations]);

  const selectedLevelObject = useMemo(() => {
    return itemType?.stampingLevels?.find((l) => l.level === selectedLevelName);
  }, [itemType, selectedLevelName]);

  const calculateDynamicPrice = useCallback(() => {
    return selectedLevelObject?.price || 0;
  }, [selectedLevelObject]);

  const handleRemoveStampImage = () => {
    setStampImageUrl(null);
  };
  
  const totalItemPrice = useMemo(() => {
    return calculateDynamicPrice() * quantity;
  }, [calculateDynamicPrice, quantity]);

  const handleSizeChange = (event, newSize) => {
    if (newSize !== null) {
      setSelectedSize(newSize);
    }
  };

  const handleColorChange = (event) => {
    const colorId = parseInt(event.target.value);
    const colorObj = availableColors.find(c => c.id === colorId);
    setSelectedColorObj(colorObj);
  };

  const handleQuantityChange = (amount) => {
    setQuantity((prev) => {
      const newQuantity = prev + amount;
      if (newQuantity < 1) return 1;
      if (selectedStock && newQuantity > selectedStock.quantity) return selectedStock.quantity;
      return newQuantity;
    });
  };

  const handleAddToCartAndCheckout = () => {
    if (!selectedStock) {
      showErrorAlert(
        'Selección Incompleta',
        'Por favor, selecciona una talla y color disponibles.'
      );
      return;
    }
    if (selectedStock.quantity === 0 || quantity > selectedStock.quantity) {
      showErrorAlert('Sin Stock', 'No hay suficiente stock para la cantidad seleccionada.');
      return;
    }

    const isStampable = itemType?.category === 'clothing' || itemType?.category === 'object';

    if (isStampable && !stampImageUrl) {
      showErrorAlert(
        'Falta Imagen',
        'Por favor, sube la imagen que deseas estampar antes de continuar.'
      );
      return;
    }

    if (isStampable && !selectedLevelObject) {
      showErrorAlert('Selección Incompleta', 'Por favor, selecciona un nivel de estampado.');
      return;
    }

    const itemToAdd = {
      itemStockId: selectedStock.id,
      itemTypeId: itemTypeId,
      quantity: quantity,
      name: itemType?.name || 'Producto',
      price: calculateDynamicPrice(),
      stampOptionsSnapshot: selectedLevelObject,
      stampImageUrl: stampImageUrl,
      stampInstructions: stampInstructions,
      colorName: selectedColorObj?.name,
      hexColor: selectedColorObj?.hex,
      size: selectedStock.size,
      productImageUrls: itemType.productImageUrls,
    };
    if (editItem) {
      removeFromCart(editItem.cartItemId);
    }

    addToCart(itemToAdd);
    showSuccessAlert(
      editItem ? '¡Actualizado!' : '¡Añadido!',
      `${itemToAdd.name} fue ${editItem ? 'actualizado' : 'añadido'} al carrito.`
    );
    navigate('/checkout');
  };

  const handlePrevImage = () => {
    if (!itemType || !itemType.productImageUrls) return;
    setCurrentImageIndex((prev) => (prev === 0 ? itemType.productImageUrls.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (!itemType || !itemType.productImageUrls) return;
    setCurrentImageIndex((prev) => (prev === itemType.productImageUrls.length - 1 ? 0 : prev + 1));
  };

  const handleStampImageUploadSuccess = (uploadedUrl) => {
    setStampImageUrl(uploadedUrl);
  };

  if (loading) {
    return (
      <Box className="shop-loading-container">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" className="shop-error-alert">
        {error}
      </Alert>
    );
  }

  if (!itemType) {
    return <Typography className="shop-empty-message">Producto no encontrado.</Typography>;
  }

  // Info del ItemType
  const { name, description, iconName, productImageUrls = [], stampingLevels = [] } = itemType;
  const IconComponent = iconName ? iconMap[iconName] : null;
const currentImageUrl = productImageUrls.length > 0 ? getFullImageUrl(productImageUrls[currentImageIndex]) : null;
  const hasMultipleImages = productImageUrls.length > 1;
  const isStampable = itemType?.category === 'clothing' || itemType?.category === 'object';
  const currentStockQuantity = selectedStock?.quantity || 0;

  return (
    <div className="product-detail-container">
      {editItem && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 'var(--border-radius-md)' }}>
          Estás editando un producto de tu carrito.
        </Alert>
      )}
      <div className="product-detail-grid">
        <div className="product-image-column">
          <section className="product-image-section">
            {currentImageUrl ? (
              <img
                src={currentImageUrl}
                alt={`${name} - Imagen ${currentImageIndex + 1}`}
                loading="lazy"
              />
            ) : IconComponent ? (
              <IconComponent size={128} strokeWidth={1} className="product-image-placeholder" />
            ) : (
              <Typography className="product-image-placeholder">Sin Imagen</Typography>
            )}
          </section>

          {hasMultipleImages && (
            <Box className="image-navigation-controls">
              <IconButton
                onClick={handlePrevImage}
                size="small"
                className="image-navigation-control-button"
              >
                <ChevronLeft />
              </IconButton>
              <Typography className="image-navigation-text">
                {currentImageIndex + 1} / {productImageUrls.length}
              </Typography>
              <IconButton
                onClick={handleNextImage}
                size="small"
                className="image-navigation-control-button"
              >
                <ChevronRight />
              </IconButton>
            </Box>
          )}
        </div>

        <section className="product-info-section">
          <Box sx={{ mb: 3 }}>
            <Typography component="h1" className="product-info__name">
              {name}
            </Typography>
            <Typography className="product-info__description" sx={{ mt: 2 }}>
              {description}
            </Typography>
          </Box>

          <Paper variant="outlined" className="selection-card">
            <Typography variant="h6" className="section-subtitle">Opciones del Producto</Typography>
            
            <div className="product-info__details">
              {/* Selector de Talla con mejor estilo */}
              {itemType.hasSizes && realAvailableSizes.length > 0 && (
                <div className="selection-group">
                  <Typography className="selection-label">Talla Disponible</Typography>
                  <ToggleButtonGroup
                    value={selectedSize}
                    exclusive
                    onChange={handleSizeChange}
                    className="size-toggle-group"
                  >
                    {realAvailableSizes.map((size) => (
                      <ToggleButton key={size} value={size} className="size-button">
                        {size}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </div>
              )}

              {/* Selector de Color tipo 'Swatches' */}
              <div className="selection-group">
                <Typography className="selection-label">Color</Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {availableColors.map((color) => (
                    <Tooltip title={color.name} key={color.id}>
                      <Box
                        onClick={() => setSelectedColorObj(color)}
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          backgroundColor: color.hex,
                          border: selectedColorObj?.id === color.id ? '3px solid var(--primary)' : '1px solid var(--gray-300)',
                          boxShadow: selectedColorObj?.id === color.id ? '0 0 0 2px var(--primary-light)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>
              </div>
              <div className="selection-group">
                <Typography className="selection-label">Disponibilidad</Typography>
                {selectedStock ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={currentStockQuantity > 0 ? `${currentStockQuantity} unidades disponibles` : "Sin stock"}
                      color={currentStockQuantity > 10 ? "success" : currentStockQuantity > 0 ? "warning" : "error"}
                      variant="outlined"
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                    {currentStockQuantity < 5 && currentStockQuantity > 0 && (
                      <Typography variant="caption" color="error.main" fontWeight="bold">
                        ¡Últimas unidades!
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Selecciona talla y color para ver disponibilidad
                  </Typography>
                )}
              </div>
            </div>
          </Paper>

          {isStampable && (
            <Box className="product-customization-section" sx={{ my: 'var(--spacing-lg)' }}>
              <Divider sx={{ mb: 'var(--spacing-md)' }} />
              <Typography variant="h6" gutterBottom sx={{ color: 'var(--secondary-dark)' }}>
                Personaliza tu Estampado
              </Typography>
              
              <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
                <Typography variant="subtitle2" gutterBottom component="legend">
                  Nivel de Estampado:
                </Typography>
                <RadioGroup
                  aria-label="stamping-level"
                  name="stamping-level"
                  value={selectedLevelName || ''}
                  onChange={(e) => setSelectedLevelName(e.target.value)}
                >
                  {stampingLevels.map((level) => (
                    <Paper
                      key={level.level}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        mb: 1,
                        cursor: 'pointer',
                        borderColor:
                          selectedLevelName === level.level ? 'var(--primary)' : 'var(--gray-300)',
                        backgroundColor:
                          selectedLevelName === level.level ? 'var(--primary-light)' : '#fff',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          borderColor: 'var(--primary)',
                          backgroundColor: 'var(--primary-light)',
                        },
                      }}
                      onClick={() => setSelectedLevelName(level.level)}
                    >
                      <FormControlLabel
                        value={level.level}
                        control={<Radio />}
                        label={
                          <Box sx={{ ml: 1, width: '100%' }}>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <Typography variant="body1" fontWeight="bold">
                                {level.level}
                              </Typography>
                              <Typography
                                variant="body1"
                                fontWeight="bold"
                                color="var(--primary-dark)"
                              >
                                + ${level.price?.toLocaleString()}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {level.description}
                            </Typography>
                          </Box>
                        }
                        sx={{
                          width: '100%',
                          cursor: 'pointer',
                        }}
                      />
                    </Paper>
                  ))}
                </RadioGroup>
              </FormControl>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Tu Imagen:
                  </Typography>
                  {stampImageUrl ? (
                    <Box sx={{ 
                      position: 'relative', 
                      width: 'fit-content', 
                      border: '2px solid var(--primary)', 
                      borderRadius: '8px', 
                      p: 0.5,
                      backgroundColor: 'white'
                    }}>
                      <img 
                        src={getFullImageUrl(stampImageUrl)} 
                        alt="Diseño a estampar" 
                        style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '4px', display: 'block' }} 
                      />
                      <IconButton 
                        size="small" 
                        onClick={handleRemoveStampImage}
                        sx={{ 
                          position: 'absolute', 
                          top: -12, 
                          right: -12, 
                          bgcolor: 'var(--error)', 
                          color: 'white',
                          boxShadow: 2,
                          '&:hover': { bgcolor: 'var(--error-dark)' } 
                        }}
                      >
                        <X size={16} />
                      </IconButton>
                    </Box>
                  ) : (
                    <ImageUploader onUploadSuccess={handleStampImageUploadSuccess} />
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Instrucciones Adicionales:
                  </Typography>
                  <TextField
                    label="Detalles extra (opcional)"
                    multiline
                    rows={4}
                    fullWidth
                    value={stampInstructions}
                    onChange={(e) => setStampInstructions(e.target.value)}
                    placeholder="Ej: Alinear el logo un poco más a la izquierda."
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
              <Divider sx={{ mt: 'var(--spacing-md)' }} />
            </Box>
          )}

          <Paper elevation={4} className="sticky-action-bar">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Total Producto</Typography>
                <Typography variant="h5" color="var(--primary)" fontWeight="800">
                  {formatCLP(totalItemPrice || 0)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <div className="quantity-controls-modern">
                  <IconButton onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1} size="small">
                    <Typography variant="h5">-</Typography>
                  </IconButton>
                  <Typography fontWeight="bold" sx={{ mx: 2 }}>{quantity}</Typography>
                  <IconButton onClick={() => handleQuantityChange(1)} disabled={quantity >= currentStockQuantity} size="small">
                    <Typography variant="h5">+</Typography>
                  </IconButton>
                </div>
                <Button
                  variant="contained"
                  className="add-to-cart-premium"
                  onClick={handleAddToCartAndCheckout}
                  disabled={!selectedStock || currentStockQuantity === 0}
                >
                  {editItem ? 'Actualizar Carrito' : 'Comprar Ahora'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </section>
      </div>
    </div>
  );
};

export default ProductDetail;
