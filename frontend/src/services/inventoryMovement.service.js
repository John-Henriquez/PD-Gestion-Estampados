import axios from './root.service';

export async function getInventoryMovements(filters = {}) {
  try {
    const { data } = await axios.get('/reports/inventory-movements/report', {
      params: filters,
    });
    return data.data || { movements: [], totals: {} };
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    return { movements: [], totals: {} };
  }
}
