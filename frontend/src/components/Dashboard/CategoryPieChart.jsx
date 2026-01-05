import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Paper, Typography, Box } from '@mui/material';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

const CategoryPieChart = ({ data = [] }) => {
  const totalItems = data.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <Paper sx={{ p: 3, height: '400px', borderRadius: '16px', display: 'flex', flexDirection: 'column' }} elevation={1}>
      <Typography variant="h6" fontWeight="700" gutterBottom>
        Ventas por Categoría
      </Typography>
      
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={75} 
              outerRadius={100}
              paddingAngle={8}
              dataKey="value"
              nameKey="name"
              animationBegin={200}
              animationDuration={1200}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => [`${value} unidades`, name]} 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend 
              verticalAlign="bottom" 
              iconType="circle"
              formatter={(value) => <span style={{ color: '#475569', fontWeight: 500, fontSize: '14px' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="textSecondary" variant="body2">Esperando datos de categorías...</Typography>
        </Box>
      )}
    </Paper>
  );
};

export default CategoryPieChart;