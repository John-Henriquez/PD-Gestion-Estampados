import axios from './root.service';

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const { data } = await axios.post('/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (data && data.data && data.data.imageUrl) {
      return data.data.imageUrl;
    } else {
      console.warn('Respuesta inesperada del endpoint /upload-image:', data);
      return data.imageUrl || Promise.reject('Formato de respuesta inesperado del servidor.');
    }
  } catch (error) {
    console.error('Error uploading image:', error.response?.data || error.message);
    throw (
      error.response?.data ||
      new Error(error.message || 'Error de red o del servidor al subir imagen.')
    );
  }
}

export async function uploadStampImage(file) {
  const formData = new FormData();
  formData.append('stampImage', file);

  try {
    const response = await axios.post('/uploads/stamp-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (
      response.status === 200 &&
      response.data.status === 'Success' &&
      response.data.data?.imageUrl
    ) {
      console.log('Imagen de estampado subida:', response.data.data.imageUrl);
      return response.data.data.imageUrl;
    } else {
      throw new Error(
        response.data.message || 'Respuesta inesperada del servidor al subir imagen de estampado.'
      );
    }
  } catch (error) {
    console.error('Error al subir imagen de estampado:', error.response?.data || error.message);
    throw (
      error.response?.data ||
      new Error(error.message || 'Error de red o del servidor al subir imagen de estampado.')
    );
  }
}

export async function uploadMultipleProductImages(files) {
  if (!files || files.length === 0) return [];
  const formData = new FormData();
  files.forEach((file) => formData.append('productImages', file));
  try {
    const response = await axios.post('/uploads/product-images/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // ... (manejo de respuesta) ...
    if (
      response.status === 200 &&
      response.data.status === 'Success' &&
      Array.isArray(response.data.data?.imageUrls)
    ) {
      return response.data.data.imageUrls;
    } else {
      throw new Error(response.data.message || 'Respuesta inesperada del servidor.');
    }
  } catch (error) {
    // ... (manejo de error) ...
    console.error('Error al subir imágenes:', error.response?.data || error.message);
    throw error.response?.data || new Error(error.message || 'Error de red o servidor.');
  }
}
