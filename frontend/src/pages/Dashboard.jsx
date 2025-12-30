import { useState, useEffect } from 'react';
import { Grid, Container, Typography, Box, CircularProgress, Alert, Button, Divider, Paper } from '@mui/material';
import { IconRefresh, IconFileAnalytics, IconClipboardCheck } from '@tabler/icons-react';

import StatCards from '../components/Dashboard/StatCards.jsx';
import SalesChart from '../components/Dashboard/SalesChart.jsx';
import StockCriticalChart from '../components/Dashboard/StockCriticalChart.jsx';
import LogicalAuditModal from '../components/Dashboard/LogicalAuditModal.jsx';

import { getDashboardStats } from '../services/report.service';
import { generateInventoryAuditSheet } from '../helpers/pdfGenerator';
import { getItemStock } from '../services/itemStock.service';

import '../styles/pages/dashboard.css';

const Dashboard = () => {
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [inventoryData, setInventoryData] = useState([])
  
  const loadData = async () => {
    setLoading(true);
    const [data, err] = await getDashboardStats();
    if (err) setError(err);
    else setStats(data);
    setLoading(false);
  };
  
  useEffect(() => {
    loadData();
    loadInventory();
  }, []);

  
  const handleLogicalAudit = async () => {
    try {
      const data = await getItemStock();
      setInventoryData(data);
      setIsAuditModalOpen(true);
    } catch (err) {
      console.error("Error al obtener stock para auditoría:", err);
    }
  };
  const loadInventory = async () => {
    const data = await getItemStock();
    setInventoryData([...data]);
  };
  
  const handleDownloadAuditSheet = async () => {
    try {
      const stockData = await getItemStock();
      if (stockData && stockData.length > 0) {
        generateInventoryAuditSheet(stockData);
      } else {
        alert("No hay ítems en inventario para auditar.");
      }
    } catch (error) {
      console.error("Error al generar la planilla:", error);
    }
  };
  
  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <CircularProgress size={60} thickness={4} />
      <Typography sx={{ mt: 2 }} color="textSecondary">Cargando métricas en tiempo real...</Typography>
    </Box>
  );
  
  console.log("📊 stats.salesHistory:", stats?.salesHistory);
  return (
    <Box className="dashboard-wrapper animate--fadeIn" sx={{ pt: 11, pb: 5 }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box>
            <Typography variant="h4" fontWeight="800" color="primary">Panel de Control</Typography>
            <Typography variant="body1" color="textSecondary">Bienvenido al centro de gestión de <b>Vibra Estampados</b></Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<IconRefresh />}
              onClick={() => {
                loadData();
                loadInventory();
              }}
            >
              Actualizar
            </Button>
            <Button variant="contained" startIcon={<IconClipboardCheck />} onClick={handleLogicalAudit}>Reporte Mensual</Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <StatCards stats={stats?.kpis} />

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} lg={8}>
            <SalesChart data={stats?.salesHistoryTransactions}/>
          </Grid>
          <Grid item xs={12} lg={4}>
            <StockCriticalChart data={inventoryData} />
          </Grid>
        </Grid>

        <Box sx={{ mt: 5 }}>
          <Divider sx={{ mb: 4 }} />
          <Typography variant="h6" fontWeight="700" gutterBottom>Gestión de Inventario y Auditoría</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderLeft: '5px solid #ef4444' }}>
                <Typography variant="subtitle1" fontWeight="bold">Revisión de Mermas</Typography>
                <Typography variant="body2" color="textSecondary">Registra pérdidas por daños en estampado o errores de conteo.</Typography>
                <Button variant="text" color="error" sx={{ mt: 1 }} href="/inventario">Ir a ajustar stock</Button>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderLeft: '5px solid #3b82f6' }}>
                <Typography variant="subtitle1" fontWeight="bold">Cubicación Mensual</Typography>
                <Typography variant="body2" color="textSecondary">Compara el stock físico contra el sistema para el cierre de mes.</Typography>
                <Button 
                  variant="text" 
                  startIcon={<IconFileAnalytics size={18} />} 
                  sx={{ mt: 1 }} 
                  onClick={handleDownloadAuditSheet}
                >
                  Generar planilla de conteo
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Box>
        <LogicalAuditModal 
          open={isAuditModalOpen} 
          onClose={() => setIsAuditModalOpen(false)} 
          stockData={inventoryData} 
          onFinish={() => {
            loadData();
            loadInventory();
          }}
        />
      </Container>
    </Box>
  );
};

export default Dashboard;