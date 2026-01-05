import { Paper, Typography, Box, LinearProgress, Avatar } from '@mui/material';
import { IconTrophy } from '@tabler/icons-react';

const TopProductsList = ({ products = [] }) => {
  console.log("🏆 [TopProductsList] Data recibida:", products);
  const maxQty = products.length > 0 ? Math.max(...products.map(p => p.totalQty)) : 0;

  return (
    <Paper sx={{ p: 3, height: '400px', borderRadius: '16px', display: 'flex', flexDirection: 'column' }} elevation={1}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <IconTrophy size={24} color="#f59e0b" />
        <Typography variant="h6" fontWeight="700">
          Productos Estrella
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {products.length > 0 ? (
          products.map((product, index) => {
            const percentage = (product.totalQty / maxQty) * 100;
            
            return (
              <Box key={index} sx={{ mb: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight="600" color="text.primary">
                    {index + 1}. {product.name}
                  </Typography>
                  <Typography variant="caption" fontWeight="700" color="primary.main">
                    {product.totalQty} unidades
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={percentage} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 5,
                    backgroundColor: '#f1f5f9',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: index === 0 ? '#f59e0b' : '#3b82f6', // El #1 es dorado
                      borderRadius: 5,
                    }
                  }} 
                />
              </Box>
            );
          })
        ) : (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="textSecondary" variant="body2">
              Sin datos de ventas aún
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default TopProductsList;