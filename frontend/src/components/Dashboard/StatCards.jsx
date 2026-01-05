import { Grid, Paper, Box, Typography } from '@mui/material';
import { 
  IconCurrencyDollar, 
  IconClipboardList, 
  IconAlertTriangle, 
  IconTag,
} from '@tabler/icons-react';
import '../../styles/components/statCards.css';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <Paper className="stat-card" elevation={0}>
    <Box 
      className="stat-icon-wrapper" 
      sx={{ backgroundColor: `${color}15`, color: color }}
    >
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

const StatCards = ({ stats }) => {
  const items = [
  { title: 'Ventas Totales', value: `$${stats?.totalSales?.toLocaleString('es-CL') || 0}`, icon: IconCurrencyDollar, color: '#10b981' },
  { title: 'Ticket Promedio', value: `$${stats?.averageTicket?.toLocaleString('es-CL') || 0}`, icon: IconTag, color: '#f59e0b' },
  { title: 'Pedidos Hoy', value: stats?.ordersToday || 0, icon: IconClipboardList, color: '#3b82f6' },
  { title: 'Stock Crítico', value: stats?.lowStockCount || 0, icon: IconAlertTriangle, color: '#ef4444' },
];

  return (
    <Grid container spacing={2}>
      {items.map((s, i) => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <StatCard {...s} />
        </Grid>
      ))}
    </Grid>
  );
};

export default StatCards;