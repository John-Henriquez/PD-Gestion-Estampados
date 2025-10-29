import { useState, useEffect } from 'react';
import { Box, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import { getPublicItemStock } from '../services/itemStock.service';
import ProductCard from '../components/Shop/ProductCard.jsx';
import '../styles/pages/shop.css';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const publicStock = await getPublicItemStock();
        setProducts(publicStock || []);
      } catch (err) {
        console.error('Error al cargar productos:', err);
        setError(err.message || 'No se pudieron cargar los productos.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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
  } else if (products.length === 0) {
    content = (
      <Typography color="textSecondary" className="shop-empty-message">
        No hay productos disponibles en este momento.
      </Typography>
    );
  } else {
    content = (
      <Grid container spacing={4} className="shop-product-grid">
        {products.map((product) => (
          <Grid item key={product.id} xs={12} sm={6} md={4} lg={6}>
            <ProductCard product={product} />
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
