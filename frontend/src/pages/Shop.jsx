import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Grid, CircularProgress, Alert, Container, Button } from '@mui/material';
import { ShoppingBag } from 'lucide-react';
import { getPublicItemStock } from '../services/itemStock.service';
import { getPacks } from '../services/pack.service';
import ProductCard from '../components/Shop/ProductCard.jsx';
import PackCard from '../components/Shop/PackCard.jsx';
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
  const [activePacks, setActivePacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [publicStock, packsData] = await Promise.all([
          getPublicItemStock(),
          getPacks({ isActive: true }),
        ]);

        setAllPublicStock(publicStock || []);
        setActivePacks(packsData || []);
      } catch (err) {
        console.error('Error al cargar datos de la tienda:', err);
        setError(err.message || 'No se pudieron cargar los productos.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const productsGroupedByItemType = useMemo(
    () => groupStockByItemType(allPublicStock),
    [allPublicStock]
  );

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

  return (
    <Box className="shop-wrapper animate--fadeIn">
      {/* --- HERO SECTION --- */}
      <Box className="shop-hero">
        <Container maxWidth="lg" className="shop-hero-content">
          <Box>
            <Typography variant="h2" className="shop-hero-title">
              Vibra con tu Estilo
            </Typography>
            <Typography variant="h6" className="shop-hero-subtitle">
              Personalización exclusiva, packs únicos y la mejor calidad en estampados.
            </Typography>
            <Button variant="contained" size="large" className="shop-hero-button" href="#productos">
              Ver Catálogo
            </Button>
          </Box>
          <Box className="shop-hero-icon">
            <ShoppingBag size={180} strokeWidth={1} />
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }} id="productos">
        {/* --- SECCIÓN PACKS --- */}
        {activePacks.length > 0 && (
          <Box className="shop-section animate--slideUp">
            <Typography variant="h4" className="shop-section-title">
              Ofertas y Packs 🔥
            </Typography>
            <Typography variant="body1" className="shop-section-subtitle">
              Ahorra comprando nuestros conjuntos seleccionados.
            </Typography>
            <Grid container spacing={3} className="shop-grid">
              {activePacks.map((pack) => (
                <Grid item key={`pack-${pack.id}`} xs={12} sm={6} md={4}>
                  <PackCard pack={pack} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* --- SECCIÓN PRODUCTOS --- */}
        <Box className="shop-section animate--slideUp">
          <Typography variant="h4" className="shop-section-title">
            Catálogo de Productos
          </Typography>
          {productsGroupedByItemType.length === 0 ? (
            <Box className="shop-empty">
              <Typography>No hay productos individuales disponibles por el momento.</Typography>
            </Box>
          ) : (
            <Grid container spacing={3} className="shop-grid">
              {productsGroupedByItemType.map((group) => (
                <Grid item key={group.itemType.id} xs={12} sm={6} md={4}>
                  <ProductCard
                    itemType={group.itemType}
                    representativeStock={group.representativeStock}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default Shop;
