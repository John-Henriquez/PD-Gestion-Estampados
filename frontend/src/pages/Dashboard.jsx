import React from 'react';
import { Grid, Container, Typography, Box } from '@mui/material';
import StatCards from '../components/Dashboard/StatCards.jsx';
import SalesChart from '../components/Dashboard/SalesChart.jsx';
import StockCriticalChart from '../components/Dashboard/StockCriticalChart.jsx';
import '../styles/pages/dashboard.css'; 

const Dashboard = () => {
  return (
    <Container maxWidth="xl" className="dashboard-wrapper">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight="800" gutterBottom>
          Dashboard de Negocio
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
          Visualización de ventas, inventario y rendimiento del sistema.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StatCards />
          </Grid>

          <Grid item xs={12} md={8}>
            <SalesChart />
          </Grid>

          <Grid item xs={12} md={4}>
            <StockCriticalChart />
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Dashboard;