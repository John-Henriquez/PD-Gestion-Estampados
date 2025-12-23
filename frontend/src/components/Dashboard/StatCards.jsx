import { Grid, Paper, Box, Typography } from '@mui/material';
import { IconTrendingUp, IconShoppingCart, IconPackage, IconAlertTriangle } from '@tabler/icons-react';
import '../../styles/components/statCards.css';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <Paper className="stat-card" elevation={0}>
    <Box className={`stat-icon-wrapper ${color}`}>
      <Icon size={24} />
    </Box>
    <Box>
      <Typography variant="caption" color="textSecondary" fontWeight="600">
        {title.toUpperCase()}
      </Typography>
      <Typography variant="h5" fontWeight="800">
        {value}
      </Typography>
    </Box>
  </Paper>
);

const StatCards = () => {
  const stats = [
    { title: 'Ventas del Mes', value: '$450.000', icon: IconTrendingUp, color: 'blue' },
    { title: 'Pedidos Hoy', value: '12', icon: IconShoppingCart, color: 'green' },
    { title: 'Total Productos', value: '154', icon: IconPackage, color: 'purple' },
    { title: 'Stock Crítico', value: '5', icon: IconAlertTriangle, color: 'red' },
  ];

  return (
    <Grid container spacing={2}>
      {stats.map((s, i) => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <StatCard {...s} />
        </Grid>
      ))}
    </Grid>
  );
};

export default StatCards;