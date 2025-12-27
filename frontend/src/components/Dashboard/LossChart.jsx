import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Paper, Typography } from '@mui/material';

const LossChart = ({ data }) => {
  const COLORS = ['#ef4444', '#f59e0b', '#6366f1', '#8b5cf6'];

  return (
    <Paper sx={{ p: 3, borderRadius: 4, height: 400 }} elevation={0} variant="outlined">
      <Typography variant="h6" fontWeight="700">Distribución de Mermas/Pérdidas</Typography>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 40, right: 40, top: 20 }}>
          <XAxis type="number" hide />
          <YAxis dataKey="reason" type="category" width={100} tick={{ fontSize: 12 }} />
          <Tooltip cursor={{ fill: 'transparent' }} />
          <Bar dataKey="quantity" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};