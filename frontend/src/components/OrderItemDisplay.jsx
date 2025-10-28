import { useState } from 'react';
import { Box, Typography, Paper, Divider, Button, Select, MenuItem, FormControl, CircularProgress } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { format as formatTempo } from "@formkit/tempo";
import { updateOrderStatus } from '../services/order.service'; 
import { showSuccessAlert, showErrorAlert } from '../helpers/sweetAlert';

import './../styles/components/orderItemDisplay.css';

const OrderItemDisplay = ({ order, isAdminView = false, onStatusChange }) => {
    const statusClassName = `status-${order.status || 'default'}`;
    const chipClassName = `chip-${order.status || 'default'}`;
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const statusOptions = ["pendiente", "pagado", "procesando", "enviado", "entregado", "cancelado", "fallido"];

    const handleStatusChange = async (event) => {
        const newStatus = event.target.value;
        if (newStatus === order.status) return; 

        const confirmed = window.confirm(`¿Cambiar estado del pedido #${order.id} a "${newStatus}"?`);
            if (!confirmed) return;

        setIsUpdatingStatus(true);
        try {
            await updateOrderStatus(order.id, newStatus);
            showSuccessAlert('¡Estado Actualizado!', `El pedido #${order.id} ahora está "${newStatus}".`);
            if (onStatusChange) {
                onStatusChange(); 
            }
        } catch (error) {
            console.error("Error al actualizar estado:", error);
            showErrorAlert('Error', error.message || 'No se pudo actualizar el estado.');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    return (
        <Paper elevation={1} className={`order-item-paper ${statusClassName}`}>
            <Box className="order-item-details">
                <Box>
                    <Typography variant="body1">Pedido <strong>#{order.id}</strong></Typography>
                    {isAdminView && (
                         <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            Cliente: {order.user ? order.user.nombreCompleto : (order.customerEmail || 'Invitado')}
                         </Typography>
                    )}
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: { xs: 'left', sm: 'center' } }}>
                    {formatTempo(order.createdAt, "DD/MM/YYYY HH:mm")}
                </Typography>
                {isAdminView ? (
                    <FormControl size="small" sx={{ minWidth: 150, position: 'relative' }}> {/* Añade position relative */}
                        <Select
                            value={order.status}
                            onChange={handleStatusChange}
                            disabled={isUpdatingStatus}
                            sx={{
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                borderRadius: '16px',
                                color: 'white', // Color por defecto
                                backgroundColor: `var(--${chipClassName.replace('chip-','')})`, // Fondo con variable CSS
                                '& .MuiSelect-icon': { color: 'white' },
                                '& fieldset': { border: 'none'},
                                '.MuiSelect-select': { paddingRight: '28px !important' }, // Espacio extra para el spinner
                                // Ajuste para texto oscuro en estados claros
                                ...( (order.status === 'pendiente' || order.status === 'procesando') && { color: 'var(--gray-900)', '& .MuiSelect-icon': { color: 'var(--gray-900)' }}),
                            }}
                            // Para que el menú desplegable tenga estilos normales
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        '& .MuiMenuItem-root': {
                                            textTransform: 'capitalize', // Muestra opciones capitalizadas
                                        },
                                    },
                                },
                             }}
                        >
                            {statusOptions.map(status => (
                                <MenuItem key={status} value={status}>
                                    {/* Capitaliza las opciones en el menú */}
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </MenuItem>
                            ))}
                        </Select>
                        {/* Indicador de carga */}
                        {isUpdatingStatus && (
                            <CircularProgress
                                size={18}
                                sx={{
                                    color: (order.status === 'pendiente' || order.status === 'procesando') ? 'var(--primary-dark)' : 'white', // Color del spinner
                                    position: 'absolute',
                                    top: '50%',
                                    right: '8px', // Posiciona a la derecha del texto
                                    marginTop: '-9px', // Centra verticalmente
                                }}
                             />
                        )}
                    </FormControl>
                ) : (
                    // Chip normal para vista de usuario
                    <Typography variant="body1" className={`order-item-status-chip ${chipClassName}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Typography>
                )}
            
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box className="order-item-summary">
                <Typography variant="body2">
                    {order.orderItems?.length} {order.orderItems?.length === 1 ? 'producto' : 'productos'} - Total: <strong>${order.total?.toLocaleString()}</strong>
                </Typography>
                <ul>
                    {order.orderItems?.slice(0, 3).map(item => (<li key={item.id}>{item.itemNameSnapshot} (x{item.quantity})</li>))}
                    {order.orderItems?.length > 3 && <li>...y más</li>}
                </ul>
            </Box>

            {/* Botón Detalles */}
            <Button size="small" component={RouterLink} to={`/order-details/${order.id}`} sx={{ mt: 1 }}>
                Ver Detalles
            </Button>
        </Paper>
    );
};

export default OrderItemDisplay;