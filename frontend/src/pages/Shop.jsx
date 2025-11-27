import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Grid, CircularProgress, Alert, Divider } from '@mui/material';
import { getPublicItemStock } from '../services/itemStock.service';
import { getPacks } from '../services/pack.service'; // <--- Importar servicio packs
import ProductCard from '../components/Shop/ProductCard.jsx';
import PackCard from '../components/Shop/PackCard.jsx'; // <--- Importar componente PackCard
import '../styles/pages/shop.css';

// ... (la función groupStockByItemType se mantiene igual) ...
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
  const [activePacks, setActivePacks] = useState([]); // <--- Estado para packs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Cargar productos y packs en paralelo
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
    <Box className="shop-container">
      <Typography variant="h4" component="h1" gutterBottom className="shop-title">
        Nuestra Tienda
      </Typography>

      {/* --- SECCIÓN PACKS --- */}
      {activePacks.length > 0 && (
        <>
          <Typography
            variant="h5"
            sx={{ mt: 4, mb: 2, color: 'var(--secondary-dark)', fontWeight: 'bold' }}
          >
            Packs Promocionales
          </Typography>
          <Grid container spacing={4} className="shop-product-grid" sx={{ mb: 6 }}>
            {activePacks.map((pack) => (
              <Grid item key={`pack-${pack.id}`} xs={12} sm={6} md={4}>
                <PackCard pack={pack} />
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ my: 4 }} />
        </>
      )}

      <Typography
        variant="h5"
        sx={{ mt: 2, mb: 2, color: 'var(--primary-dark)', fontWeight: 'bold' }}
      >
        Productos Individuales
      </Typography>
      {productsGroupedByItemType.length === 0 ? (
        <Typography color="textSecondary" className="shop-empty-message">
          No hay productos individuales disponibles.
        </Typography>
      ) : (
        <Grid container spacing={4} className="shop-product-grid">
          {productsGroupedByItemType.map((productGroup) => (
            <Grid item key={productGroup.itemType.id} xs={12} sm={6} md={4}>
              <ProductCard
                itemType={productGroup.itemType}
                representativeStock={productGroup.representativeStock}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Shop;
