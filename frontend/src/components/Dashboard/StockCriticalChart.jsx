import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { Paper, Typography, Box } from '@mui/material';

const StockCriticalChart = ({ data }) => {
  const chartData = (data || [])
    .map(item => ({
      label: `${item.itemType?.name} (${item.color?.name || 'N/A'})`,
      quantity: item.quantity,
      minStock: item.minStock ?? 5,
      variantInfo: `${item.size || 'Talla Única'}`
    }))
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 10);

  return (
    <Paper sx={{ p: 3, height: '400px', borderRadius: '16px' }} elevation={1}>
      <Box>
        <Typography variant="h6" fontWeight="700">Stock Crítico</Typography>
        <Typography variant="caption" color="textSecondary">Artículos con mayor urgencia de reposición</Typography>
      </Box>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="90%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="label" 
              type="category" 
              width={120} 
              style={{ fontSize: '10px', fontWeight: 600 }}
              tick={{ fill: 'var(--gray-700)' }}
            />
          <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  const isCritical = d.quantity <= d.minStock;
                  return (
                    <Box sx={{ bgcolor: 'white', p: 1.5, border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                      <Typography variant="body2" fontWeight="700">{d.label}</Typography>
                      <Typography variant="caption" display="block">Talla: {d.variantInfo}</Typography>
                      <Typography variant="body2" color={isCritical ? 'error.main' : 'warning.main'} sx={{ mt: 0.5 }}>
                         Stock: {d.quantity} / Mín: {d.minStock}
                      </Typography>
                    </Box>
                  );
                }
                return null;
              }}
            />
          <Bar dataKey="quantity" radius={[0, 4, 4, 0]} barSize={20}>
              {chartData.map((entry, index) => {
                let barColor = '#94a3b8';
                if (entry.quantity <= 0) barColor = '#7f1d1d';
                else if (entry.quantity <= entry.minStock) barColor = '#ef4444';
                else barColor = '#f59e0b';

                return <Cell key={`cell-${index}`} fill={barColor} />;
              })}
            </Bar>
        </BarChart>
      </ResponsiveContainer>
      ) : (
        <Box sx={{ height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="textSecondary">Cargando datos de inventario...</Typography>
        </Box>
      )}
    </Paper>
  );
};

export default StockCriticalChart;