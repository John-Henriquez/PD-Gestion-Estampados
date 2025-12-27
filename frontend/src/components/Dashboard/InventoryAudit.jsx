import { Table, TableBody, TableCell, TableHead, TableRow, Button, TextField } from '@mui/material';

const InventoryAudit = ({ items }) => {
  return (
    <Box sx={{ mt: 4, p: 3, bgcolor: 'white', borderRadius: 4 }}>
      <Typography variant="h6" fontWeight="700" gutterBottom>
         Auditoría de Inventario (Revisión Física)
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Producto</TableCell>
            <TableCell>Stock Sistema</TableCell>
            <TableCell>Conteo Físico</TableCell>
            <TableCell>Diferencia (Pérdida)</TableCell>
            <TableCell>Acción</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.itemType.name} - {item.size}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>
                <TextField size="small" type="number" placeholder="Ej: 18" />
              </TableCell>
              <TableCell color="error">-2</TableCell>
              <TableCell>
                <Button variant="outlined" color="warning" size="small">Marcar Pérdida</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};