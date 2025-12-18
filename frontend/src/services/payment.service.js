import axios from './root.service';

export const createPaymentPreference = async (orderId) => {
  try {
    const response = await axios.post('/payments/create-preference', { orderId });
    return response.data.data;
  } catch (error) {
    console.error('Error creando preferencia de pago:', error);
    throw error.response?.data || error.message;
  }
};

export const verifyPaymentStatus = async (paymentId, orderId) => {
  try {
    const response = await axios.post('/payments/verify-payment', { paymentId, orderId });
    return response.data;
  } catch (error) {
    console.error('Error verificando pago:', error);
    throw error.response?.data || error.message;
  }
};
