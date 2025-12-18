import { AppDataSource } from "../config/configDb.js";
import Color from "../entity/color.entity.js";
import { handleSuccess, handleErrorServer } from "../handlers/responseHandlers.js";

export const colorController = {
  async getColors(req, res) {
    try {
      const colorRepo = AppDataSource.getRepository(Color);
      const colors = await colorRepo.find({ order: { name: "ASC" } });
      handleSuccess(res, 200, "Colores obtenidos", colors);
    } catch (error) {
      handleErrorServer(res, 500, "Error al obtener colores");
    }
  }
};