import axios from './root.service';

export async function getPacks(params = {}) {
  try {
    const { data } = await axios.get('/packs', { params });
    return data.data || [];
  } catch (error) {
    console.error('Error fetching packs:', error);
    return [];
  }
}

export async function createPack(packData) {
  try {
    const response = await axios.post('/packs', packData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating pack:', error);
    throw error.response?.data || error.message;
  }
}

export async function updatePack(id, updatedData) {
  try {
    const response = await axios.patch(`/packs/${id}`, updatedData);
    return response.data.data;
  } catch (error) {
    console.error('Error updating pack:', error);
    throw error.response?.data || error.message;
  }
}

export async function deletePack(id) {
  try {
    const response = await axios.delete(`/packs/${id}`);
    return [response.data, null];
  } catch (error) {
    return [
      null,
      {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      },
    ];
  }
}

export async function getDeletedPacks() {
  try {
    const { data } = await axios.get('/packs', { params: { isActive: false } });
    return data.data || [];
  } catch (error) {
    console.error('Error fetching deleted packs:', error);
    return [];
  }
}

export async function restorePack(id) {
  try {
    const { data } = await axios.patch(`/packs/restore/${id}`);
    return data.data;
  } catch (error) {
    console.error('Error restoring pack:', error);
    throw error.response?.data || error.message;
  }
}

export async function emptyDeletedPacks() {
  try {
    const { data } = await axios.delete('/packs/trash');
    return data;
  } catch (error) {
    console.error('Error emptying deleted packs:', error);
    throw error.response?.data || error.message;
  }
}

export async function forceDeletePack(id) {
  try {
    const response = await axios.delete(`/packs/force-delete/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error force deleting pack:', error);
    throw error.response?.data || error.message;
  }
}
