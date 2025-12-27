import { useState, useMemo } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Table, TableBody, TableCell, TableHead, TableRow, 
  TextField, Typography, Box, Chip 
} from '@mui/material';
import { adjustStock } from '../../services/itemStock.service';
import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';

const LogicalAuditModal = ({ open, onClose, stockData, onFinish }) => {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (id, value) => {
    setCounts(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    let successCount = 0;

    try {
      for (const item of stockData) {
        const physicalQty = parseInt(counts[item.id]);
        
        if (!isNaN(physicalQty)) {
          const difference = physicalQty - item.quantity;
          
          if (difference !== 0) {
            const reason = `Ajuste por cubicación mensual - Fecha: ${new Date().toLocaleDateString()}`;
            const [_, error] = await adjustStock(item.id, difference, reason);
            if (!error) successCount++;
          }
        }
      }
      
      showSuccessAlert('Cubicación Procesada', `Se realizaron ${successCount} ajustes de inventario.`);
      onFinish();
      onClose();
    } catch (error) {
      showErrorAlert('Error', 'Hubo un problema al procesar algunos ajustes.');
    } finally {
      setLoading(false);
      setCounts({});
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>Cubicación Lógica - Reporte Mensual</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Ingrese el conteo real obtenido en bodega. El sistema generará movimientos de ajuste automáticos por la diferencia.
        </Typography>
        
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Producto</TableCell>
              <TableCell align="center">Stock Sistema</TableCell>
              <TableCell align="center">Conteo Real</TableCell>
              <TableCell align="center">Diferencia</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stockData.map((item) => {
              const physicalInput = counts[item.id];
              const physicalValue = (physicalInput === undefined || physicalInput === '') 
                ? item.quantity 
                : parseInt(physicalInput, 10);

              const safePhysical = isNaN(physicalValue) ? 0 : physicalValue;
              const diff = safePhysical - item.quantity;
              
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.itemType?.name} 
                    <Typography variant="caption" display="block">{item.size} - {item.color?.name}</Typography>
                  </TableCell>
                  <TableCell align="center">{item.quantity}</TableCell>
                  <TableCell align="center">
                    <TextField 
                      type="number" 
                      size="small" 
                      sx={{ width: 80 }}
                      onChange={(e) => handleInputChange(item.id, e.target.value)}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                    label={isNaN(diff) ? "0" : (diff > 0 ? `+${diff}` : diff.toString())} 
                    color={diff === 0 ? "default" : diff > 0 ? "success" : "error"}
                    variant="outlined"
                    size="small"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || Object.keys(counts).length === 0}
        >
          {loading ? 'Procesando...' : 'Aplicar Ajustes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LogicalAuditModal;