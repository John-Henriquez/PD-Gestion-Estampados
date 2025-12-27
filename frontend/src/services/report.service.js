import api from './root.service';

export const getDashboardStats = async () => {
  try {
    const response = await api.get('/reports/stats');
    return [response.data.data, null];
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return [null, error.response?.data?.message || "Error al conectar con el servidor"];
  }
};

export const getInventoryLossReport = async () => {
  try {
    const response = await api.get('/reports/inventory-losses');
    return [response.data.data, null];
  } catch (error) {
    console.error("Error al obtener reporte de pérdidas:", error);
    return [null, error.response?.data?.message || "Error al conectar con el servidor"];
  }
};