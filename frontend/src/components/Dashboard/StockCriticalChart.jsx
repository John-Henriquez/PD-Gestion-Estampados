import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Paper, Typography, Box } from '@mui/material';

const StockCriticalChart = ({ data }) => {
  const chartData = (data || [])
    .map(item => ({
      label: `${item.itemType?.name ?? 'Producto'} - ${item.size}`,
      quantity: item.quantity,
      minStock: item.minStock ?? 5
    }))
    .sort((a, b) => a.quantity - b.quantity);

  return (
    <Paper sx={{ p: 3, height: '400px', borderRadius: '16px' }} elevation={1}>
      <Typography variant="h6" fontWeight="700" gutterBottom>
        Estado del Inventario
      </Typography>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis type="number" hide />
            <YAxis 
              dataKey="label" 
              type="category" 
              width={100} 
              style={{ fontSize: '10px', fontWeight: 600 }}
              tick={{ fill: 'var(--gray-700)' }}
            />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            formatter={(value, name, props) => {
                const isCritical = value <= (props.payload.minStock || 5);
                return [
                  `${value} unidades ${isCritical ? '⚠️' : '✅'}`, 
                  'Stock actual'
                ];
              }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
          <Bar dataKey="quantity" radius={[0, 4, 4, 0]} barSize={chartData.length > 10 ? 15 : 25}>
              {chartData.map((entry, index) => {
                let barColor = '#3b82f6';
                const min = entry.minStock || 5;

                if (entry.quantity <= 0) {
                  barColor = '#7f1d1d';
                } else if (entry.quantity <= min) {
                  barColor = '#ef4444';
                } else if (entry.quantity <= min * 2) {
                  barColor = '#f59e0b';
                }

                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={barColor}
                  />
                );
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