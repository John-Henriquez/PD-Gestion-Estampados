import axios from './root.service';

export async function getItemTypes() {
  try {
    const { data } = await axios.get('/item-types');
    return data.data || [];
  } catch (error) {
    console.error('Error al obtener tipos de ítems:', error);
    throw error.response?.data?.message || 'Error al obtener tipos de ítems';
  }
}

export async function getItemTypeById(id) {
  try {
    const { data } = await axios.get(`/item-types/${id}`);
    return data.data || [];
  } catch (error) {
    console.error(`Error al obtener el tipo de ítem ${id}:`, error);
    throw error.response?.data?.message || 'Error al obtener el tipo de ítem';
  }
}

export async function createItemType(formData) {
  try {
    const response = await axios.post('/item-types', formData);
    return response.data.data;
  } catch (error) {
    console.error('Error al crear el tipo de ítem:', error);
    throw (
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Error al crear el tipo de ítem'
    );
  }
}

export async function updateItemType(id, formData) {
  try {
    const response = await axios.patch(`/item-types/${id}`, formData);
    return response.data.data;
  } catch (error) {
    console.error(`Error al actualizar el tipo de ítem ${id}:`, error);
    throw (
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Error al actualizar el tipo de ítem'
    );
  }
}

export async function deleteItemType(id) {
  try {
    const response = await axios.delete(`/item-types/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error al eliminar el tipo de ítem ${id}:`, error);
    throw error.response?.data?.message || 'Error al eliminar el tipo de ítem';
  }
}

export async function restoreItemType(id) {
  try {
    const response = await axios.patch(`/item-types/restore/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error al restaurar el tipo de ítem ${id}:`, error);
    throw error.response?.data?.message || 'Error al restaurar el tipo de ítem';
  }
}
export async function getDeletedItemTypes() {
  try {
    const { data } = await axios.get('/item-types/deleted');
    return data.data || [];
  } catch (error) {
    console.error('Error al obtener tipos de ítems eliminados:', error);
    throw error.response?.data?.message || 'Error al obtener tipos de ítems eliminados';
  }
}

export async function forceDeleteItemType(id) {
  try {
    const { data } = await axios.delete(`/item-types/force/${id}`);
    return data.data;
  } catch (error) {
    console.error(`Error al eliminar permanentemente el tipo de ítem ${id}:`, error);
    throw error.response?.data?.message || 'Error al eliminar permanentemente el tipo de ítem';
  }
}

export async function emptyTrash() {
  try {
    const { data } = await axios.delete('/item-types/trash/empty');
    return data.data;
  } catch (error) {
    console.error('Error al vaciar la papelera:', error);
    throw error.response?.data?.message || 'Error al vaciar la papelera';
  }
}

export async function getGlobalStampingLevels() {
  try {
    const { data } = await axios.get('/item-types/stamping-levels/list');
    return data.data || [];
  } catch (error) {
    console.error('Error al obtener niveles globales:', error);
    throw error.response?.data?.message || 'Error al obtener niveles de estampado';
  }
}
