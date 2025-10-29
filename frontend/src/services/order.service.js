import axios from './root.service';

export async function createOrder(orderData) {
  try {
    console.log('Enviando datos para crear pedido:', orderData);

    const response = await axios.post('/orders', orderData);

    if (response.status === 201 && response.data.status === 'Success') {
      console.log('Pedido creado exitosamente:', response.data.data);
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Error inesperado al crear el pedido');
    }
  } catch (error) {
    console.error('Error al crear el pedido:', error.response?.data || error.message);
    throw (
      error.response?.data ||
      new Error(error.message || 'Error de red o del servidor al crear el pedido')
    );
  }
}

export async function getMyOrders() {
  try {
    const response = await axios.get('/orders');
    if (response.status === 200 && response.data.status === 'Success') {
      return response.data.data || [];
    } else {
      throw new Error(response.data.message || 'Error inesperado al obtener mis pedidos');
    }
  } catch (error) {
    console.error('Error al obtener mis pedidos:', error.response?.data || error.message);
    throw (
      error.response?.data ||
      new Error(error.message || 'Error de red o del servidor al obtener mis pedidos')
    );
  }
}

export async function getAllOrders() {
  try {
    const response = await axios.get('/orders/all');
    if (response.status === 200 && response.data.status === 'Success') {
      return response.data.data || [];
    } else {
      throw new Error(response.data.message || 'Error inesperado al obtener todos los pedidos');
    }
  } catch (error) {
    console.error(
      'Error al obtener todos los pedidos (Admin):',
      error.response?.data || error.message
    );
    throw error.response?.data || new Error(error.message || 'Error de red o del servidor');
  }
}

export async function getOrderById(orderId) {
  try {
    const response = await axios.get(`/orders/${orderId}`);
    if (response.status === 200 && response.data.status === 'Success') {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Error inesperado al obtener el detalle del pedido');
    }
  } catch (error) {
    console.error(`Error al obtener el pedido ${orderId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error(error.message || 'Error de red o del servidor');
  }
}

export async function updateOrderStatus(orderId, newStatus) {
  try {
    const response = await axios.patch(`/orders/${orderId}/status`, {
      status: newStatus,
    });

    if (response.status === 200 && response.data.status === 'Success') {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || 'Error inesperado al actualizar el estado del pedido'
      );
    }
  } catch (error) {
    console.error(
      `Error al actualizar estado del pedido ${orderId}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || new Error(error.message || 'Error de red o del servidor');
  }
}
