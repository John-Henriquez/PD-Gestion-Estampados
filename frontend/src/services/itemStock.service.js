import axios from './root.service';

export async function getItemStock() {
  try {
    const { data } = await axios.get('/item-stocks');
    return data.data || [];
  } catch (error) {
    console.error('Error fetching item stock:', error);
    return [];
  }
}

export async function getPublicItemStock(filters = {}) {
  try {
    const response = await axios.get('/item-stocks/public', { params: filters });

    if (response.status === 200 && response.data.status === 'Success') {
      console.log('Stock público obtenido:', response.data.data);
      return response.data.data || [];
    } else {
      throw new Error(response.data.message || 'Error inesperado al obtener el stock público');
    }
  } catch (error) {
    console.error('Error al obtener stock público:', error.response?.data || error.message);
    throw (
      error.response?.data ||
      new Error(error.message || 'Error de red o del servidor al obtener stock público')
    );
  }
}

export async function createItemStock(itemData) {
  try {
    console.log('Datos enviados al backend:', itemData);
    const response = await axios.post('/item-stocks', itemData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating item:', error);
    throw error.response?.data || error.message;
  }
}

export async function updateItemStock(id, updatedData) {
  try {
    const response = await axios.patch(`/item-stocks/${id}`, updatedData);
    return response.data.data;
  } catch (error) {
    const backendError = error.response?.data;
    console.error('Error actualizando stock:', backendError || error.message);
    console.error('Detalles:', backendError?.details);
    throw backendError || error.message;
  }
}

export async function deleteItemStock(id) {
  try {
    const response = await axios.delete(`/item-stocks/${id}`);
    return [response.data, null];
  } catch (error) {
    console.error('Error deleting item stock:', error);
    return [
      null,
      {
        status: error.response?.status,
        message: error.response?.data?.message || error.message || 'Error desconocido',
      },
    ];
  }
}

export async function getDeletedItemStock() {
  try {
    const { data } = await axios.get('/item-stocks', {
      params: { isActive: false },
    });
    return data.data || [];
  } catch (error) {
    console.error('Error fetching deleted item stock:', error);
    return [];
  }
}

export async function restoreItemStock(id) {
  try {
    const { data } = await axios.patch(`/item-stocks/restore/${id}`);
    return data.data;
  } catch (error) {
    console.error('Error restoring item stock:', error);
    throw error.response?.data || error.message;
  }
}

export async function emptyDeletedItemStock() {
  try {
    const { data } = await axios.delete('/item-stocks/trash');
    return data;
  } catch (error) {
    console.error('Error emptying deleted item stock:', error);
    throw error.response?.data || error.message;
  }
}

export async function forceDeleteItemStock(id) {
  try {
    const response = await axios.delete(`/item-stocks/force-delete/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error force deleting item stock:', error);
    throw error.response?.data || error.message;
  }
}

export async function addManualStock(id, quantity) {
  try {
    const response = await axios.patch(`/item-stocks/adjust/${id}/add`, {
      quantity,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error adding manual stock:', error);
    throw error.response?.data || error.message;
  }
}

export async function removeManualStock(id, quantity) {
  try {
    const response = await axios.patch(`/item-stocks/adjust/${id}/remove`, {
      quantity,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error removing manual stock:', error);
    throw error.response?.data || error.message;
  }
}

export async function getItemStockById(itemTypeId) {
  try {
    const response = await axios.get(`/item-stocks/public`, {
      params: { itemTypeId: itemTypeId },
    });

    if (response.status === 200 && response.data.status === 'Success') {
      console.log(`Detalles de ItemStock ${itemTypeId} obtenidos:`, response.data.data);
      return response.data.data || [];
    } else {
      throw new Error(
        response.data.message || `Error inesperado al obtener ItemStock ${itemTypeId}`
      );
    }
  } catch (error) {
    console.error(
      `Error al obtener ItemStock ${itemTypeId}:`,
      error.response?.data || error.message
    );
    throw (
      error.response?.data ||
      new Error(error.message || `Error de red o servidor al obtener ItemStock ${itemTypeId}`)
    );
  }
}

export async function restockVariants(restockData) {
  try {
    const { data } = await axios.post('/item-stocks/restock', restockData);
    return [data.data, null];
  } catch (error) {
    console.error('Error en restock masivo:', error);
    return [
      null,
      error.response?.data?.message || 'Error al procesar la recarga masiva'
    ];
  }
}