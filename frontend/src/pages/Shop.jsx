import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import { getPublicItemStock } from '../services/itemStock.service';
import ProductCard from '../components/Shop/ProductCard.jsx';
import '../styles/pages/shop.css';

const groupStockByItemType = (stockItems) => {
  const itemTypesMap = new Map();
  stockItems.forEach((item) => {
    const typeId = item.itemType.id;

    if (!itemTypesMap.has(typeId)) {
      itemTypesMap.set(typeId, {
        itemType: item.itemType,
        representativeStock: item,
      });
    }
  });
  return Array.from(itemTypesMap.values());
};

const Shop = () => {
  const [allPublicStock, setAllPublicStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const publicStock = await getPublicItemStock();
        setAllPublicStock(publicStock || []);
      } catch (err) {
        console.error('Error al cargar productos:', err);
        setError(err.message || 'No se pudieron cargar los productos.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const productsGroupedByItemType = useMemo(
    () => groupStockByItemType(allPublicStock),
    [allPublicStock]
  );

  let content;

  if (loading) {
    content = (
      <Box className="shop-loading-container">
        <CircularProgress />
      </Box>
    );
  } else if (error) {
    content = (
      <Alert severity="error" className="shop-error-alert">
        {error}
      </Alert>
    );
  } else if (productsGroupedByItemType.length === 0) {
    content = (
      <Typography color="textSecondary" className="shop-empty-message">
        No hay productos disponibles en este momento.
      </Typography>
    );
  } else {
    content = (
      <Grid container spacing={4} className="shop-product-grid">
        {productsGroupedByItemType.map((productGroup) => (
          <Grid item key={productGroup.itemType.id} xs={12} sm={6} md={4} lg={6}>
            <ProductCard
              itemType={productGroup.itemType}
              representativeStock={productGroup.representativeStock}
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Box className="shop-container">
      <Typography variant="h4" component="h1" gutterBottom className="shop-title">
        Nuestros Productos
      </Typography>

      {content}
    </Box>
  );
};

export default Shop;
