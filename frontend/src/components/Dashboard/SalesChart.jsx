import { Paper, Typography, Box } from '@mui/material';

const SalesChart = () => {
  return (
    <Paper sx={{ p: 3, height: '400px', borderRadius: '16px' }} elevation={0}>
      <Typography variant="h6" fontWeight="700" gutterBottom>
        Rendimiento de Ventas
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', bgcolor: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
        <Typography color="textSecondary">
          [Gráfico Recharts (SVG) se renderizará aquí]
        </Typography>
      </Box>
    </Paper>
  );
};

export default SalesChart;