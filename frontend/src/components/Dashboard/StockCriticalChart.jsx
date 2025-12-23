import { Paper, Typography, List, ListItem, ListItemText, ListItemIcon, Chip } from '@mui/material';
import { IconAlertCircle } from '@tabler/icons-react';

const StockCriticalChart = () => {
  return (
    <Paper sx={{ p: 3, height: '400px', borderRadius: '16px' }} elevation={0}>
      <Typography variant="h6" fontWeight="700" gutterBottom>
        Alertas de Stock
      </Typography>
      <List>
        {['Polera XL Blanca', 'Taza Sublimación'].map((item, i) => (
          <ListItem key={i} sx={{ px: 0 }}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <IconAlertCircle color="red" />
            </ListItemIcon>
            <ListItemText primary={item} secondary="Bajo stock mínimo" />
            <Chip label="2 unid" size="small" color="error" variant="outlined" />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default StockCriticalChart;