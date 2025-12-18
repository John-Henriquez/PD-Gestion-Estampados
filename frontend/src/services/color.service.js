import axios from './root.service.js';

export const getColors = async () => {
  try {
    const response = await axios.get('/colors');
    if (response.status === 200) {
      return [response.data.data, null];
    }
    return [null, "Error al obtener colores"];
  } catch (error) {
    return [null, error.response?.data?.message || "Error de conexión"];
  }
};