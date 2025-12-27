import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Paper, Typography, Box } from '@mui/material';

const StockCriticalChart = ({ data = [] }) => {
  // Si no hay data real aún, Recharts simplemente no renderizará barras, 
  // pero podemos poner un mensaje amigable.
  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3, height: '400px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} elevation={0}>
        <Typography color="textSecondary">No hay alertas de stock crítico hoy ✅</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: '400px', borderRadius: '16px' }} elevation={0}>
      <Typography variant="h6" fontWeight="700" gutterBottom>
        Prioridad de Reposición
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Productos por debajo del stock mínimo configurado.
      </Typography>
      
      <Box sx={{ width: '100%', height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 30, right: 30 }}>
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={100} 
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              formatter={(value, name) => [value, name === 'quantity' ? 'Stock Actual' : 'Mínimo']}
            />
            {/* Barra de Stock Actual */}
            <Bar dataKey="quantity" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.quantity <= (entry.minStock / 2) ? '#b91c1c' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
         <Typography variant="caption" color="error">🔴 Crítico (≤ 50% del min)</Typography>
         <Typography variant="caption" color="warning.main">🟠 Bajo</Typography>
      </Box>
    </Paper>
  );
};

export default StockCriticalChart;