import { handleErrorClient, handleSuccess } from "../handlers/responseHandlers.js";

const uploadStampImage = (req, res) => {
  if (!req.file) {
    return handleErrorClient(res, 400, "No se envió ningún archivo de imagen.");
  }
  const imageUrl = `/uploads/${req.file.filename}`;

  return handleSuccess(res, 200, "Imagen de estampado subida correctamente", { imageUrl: imageUrl });
};

const uploadMultipleProductImages = (req, res) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return handleErrorClient(res, 400, "No se enviaron archivos de imagen.");
  }

  const imageUrls = req.files.map(file => `/uploads/${file.filename}`);

  return handleSuccess(res, 200, "Imágenes de producto subidas correctamente", { imageUrls: imageUrls }); 
};

export const uploadController = {
  uploadStampImage,
  uploadMultipleProductImages, 
};
