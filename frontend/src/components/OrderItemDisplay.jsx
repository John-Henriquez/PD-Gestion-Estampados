import { Box, Typography, Paper, Divider, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { format as formatTempo } from "@formkit/tempo";

import './../styles/components/orderItemDisplay.css';

const OrderItemDisplay = ({ order, isAdminView = false }) => {
    // Determina las clases CSS según el estado del pedido
    const statusClassName = `status-${order.status || 'default'}`;
    const chipClassName = `chip-${order.status || 'default'}`;

    return (
        // Aplica clases CSS definidas en orderItemDisplay.css
        <Paper elevation={1} className={`order-item-paper ${statusClassName}`}>
            <Box className="order-item-details">
                <Box>
                    <Typography variant="body1">Pedido <strong>#{order.id}</strong></Typography>
                    {/* Muestra cliente solo en vista admin */}
                    {isAdminView && (
                         <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            Cliente: {order.user ? order.user.nombreCompleto : (order.customerEmail || 'Invitado')}
                         </Typography>
                    )}
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: { xs: 'left', sm: 'center' } }}>
                    {formatTempo(order.createdAt, "DD/MM/YYYY HH:mm")}
                </Typography>
                {/* Aplica clases CSS para el chip */}
                <Typography variant="body1" className={`order-item-status-chip ${chipClassName}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Typography>
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

            {/* Futuro: Control para cambiar estado (solo si isAdminView es true y onStatusChange existe) */}
            {/* {isAdminView && onStatusChange && ( ... Select/Button ... )} */}

            {/* Botón Detalles (Sprint 6) */}
            <Button size="small" component={RouterLink} to={`/order-details/${order.id}`} sx={{ mt: 1 }}>
                Ver Detalles
            </Button>
        </Paper>
    );
};

export default OrderItemDisplay;