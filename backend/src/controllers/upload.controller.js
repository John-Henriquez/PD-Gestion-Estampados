import { handleErrorClient, handleSuccess } from "../handlers/responseHandlers.js";

const uploadImage = (req, res) => {
  if (!req.file) {
    return handleErrorClient(res, 400, "No se envió ningún archivo.");
  }

  const imageUrl = `/uploads/${req.file.filename}`;

 return handleSuccess(res, 200, "Imagen subida correctamente", { imageUrl: imageUrl });
};

export default {
  uploadImage,
};
