import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";
import { itemTypeService } from "../services/itemType.service.js";
import {
  createItemTypeSchema,
  updateItemTypeSchema,
} from "../validations/itemType.validation.js";

export const itemTypeController = {
  async createItemType(req, res) {
    try {
      if (req.files && req.files.length > 0) {
        req.body.productImageUrls = req.files.map(
          (file) => `/uploads/${file.filename}`,
        );
        console.log(
          `${req.files.length} imágenes subidas, productImageUrls seteado:`,
          req.body.productImageUrls,
        );
      } else {
        req.body.productImageUrls = req.body.productImageUrls || [];
        console.log("No se recibieron archivos de imagen.");
      }

      if (typeof req.body.printingMethods === "string") {
        req.body.printingMethods = JSON.parse(req.body.printingMethods);
        console.log("printingMethods parseado:", req.body.printingMethods);
      }

      if (typeof req.body.initialStock === "string") {
        try {
          req.body.initialStock = JSON.parse(req.body.initialStock);
          console.log("initialStock parseado:", req.body.initialStock);
        } catch (e) {
          req.body.initialStock = [];
        }
      }

      if (typeof req.body.stampingLevels === "string") {
        console.log("stampingLevels recibido como string, se procesará en el servicio.");
      }
      if (typeof req.body.sizesAvailable === "string") {
        req.body.sizesAvailable = JSON.parse(req.body.sizesAvailable);
        console.log("sizesAvailable parseado:", req.body.sizesAvailable);
      }

      if (Array.isArray(req.body.printingMethods)) {
        req.body.printingMethods = req.body.printingMethods.flat(Infinity);
        console.log("printingMethods flatten:", req.body.printingMethods);
      }

      if (Array.isArray(req.body.sizesAvailable)) {
        req.body.sizesAvailable = req.body.sizesAvailable.flat(Infinity);
        console.log("sizesAvailable flatten:", req.body.sizesAvailable);
      }

      const { error, validatedBody } = createItemTypeSchema.validate(req.body);
      if (error) {
        console.error("Error de validación Joi:", error.details);
        return handleErrorClient(
          res,
          400,
          "Error de validación",
          error.details.map((d) => d.message),
        );
      }
      console.log("Validación Joi OK");

      const userId = req.user?.id;
      if (!userId) return handleErrorClient(res, 401, "Usuario no autenticado");

      const [newItemType, serviceError] = await itemTypeService.createItemType(
        req.body,
        userId,
      );
      if (serviceError) {
        console.error("Error en itemTypeService.createItemType:", serviceError);
        return handleErrorClient(res, 400, serviceError);
      }

      console.log("Tipo de ítem creado exitosamente:", newItemType);
      handleSuccess(res, 201, "Tipo de ítem creado", newItemType);
    } catch (error) {
      console.error("Error en createItemType catch:", error);
      handleErrorServer(res, 500, error.message);
    }
  },

  async getItemTypes(req, res) {
    try {
      const [itemTypes, error] = await itemTypeService.getItemTypes();
      if (error) return handleErrorClient(res, 404, error);

      handleSuccess(res, 200, "Tipos de ítem obtenidos", itemTypes);
    } catch (error) {
      handleErrorServer(res, 500, error.message);
    }
  },

  async getItemTypeById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        console.error("ID inválido:", id);
        return handleErrorClient(res, 400, "ID inválido");
      }

      const [itemType, error] = await itemTypeService.getItemTypeById(id);
      if (error) {
        console.error("Error en itemTypeService.getItemTypeById:", error);
        return handleErrorClient(res, 404, error);
      }

      console.log("Tipo de ítem obtenido por ID:", itemType);
      handleSuccess(res, 200, "Tipo de ítem obtenido", itemType);
    } catch (error) {
      console.error("Error en getItemTypeById catch:", error);
      handleErrorServer(res, 500, error.message);
    }
  },

  async updateItemType(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        console.error("ID inválido:", id);
        return handleErrorClient(res, 400, "ID inválido");
      }

      const newImageUrls = [];
      if (req.files && req.files.length > 0) {
        newImageUrls = req.files.map((file) => `/uploads/${file.filename}`);
        console.log("Nuevas imágenes subidas:", newImageUrls);
      }

      let existingImageUrls = [];
      if (typeof req.body.productImageUrls === "string") {
        try {
          existingImageUrls = JSON.parse(req.body.productImageUrls);
        } catch (e) {
          existingImageUrls = [];
        }
      } else if (Array.isArray(req.body.productImageUrls)) {
        existingImageUrls = req.body.productImageUrls;
      }

      req.body.productImageUrls = [...existingImageUrls, ...newImageUrls];
      
      if (typeof req.body.hasSizes === "string") {
        req.body.hasSizes = JSON.parse(req.body.hasSizes);
        console.log("hasSizes parseado:", req.body.hasSizes);
      }

      if (typeof req.body.printingMethods === "string") {
        req.body.printingMethods = JSON.parse(req.body.printingMethods);
        console.log("printingMethods parseado:", req.body.printingMethods);
      }

      if (typeof req.body.sizesAvailable === "string") {
        req.body.sizesAvailable = JSON.parse(req.body.sizesAvailable);
        console.log("sizesAvailable parseado:", req.body.sizesAvailable);
      }

      if (typeof req.body.stampingLevels === "string") {
        console.log("stampingLevels recibido como string, se procesará en el servicio.");
      }

      if (Array.isArray(req.body.printingMethods)) {
        req.body.printingMethods = req.body.printingMethods.flat(Infinity);
        console.log("printingMethods flatten:", req.body.printingMethods);
      }

      if (Array.isArray(req.body.sizesAvailable)) {
        req.body.sizesAvailable = req.body.sizesAvailable.flat(Infinity);
        console.log("sizesAvailable flatten:", req.body.sizesAvailable);
      }

      const { error } = updateItemTypeSchema.validate(req.body);
      if (error) {
        console.error("Error de validación Joi:", error.details);
        return handleErrorClient(
          res,
          400,
          "Error de validación",
          error.details,
        );
      }

      const userId = req.user?.id;
      if (!userId) return handleErrorClient(res, 401, "Usuario no autenticado");

      const [updatedItemType, serviceError] =
        await itemTypeService.updateItemType(id, req.body, userId);
      if (serviceError) {
        console.error("Error en itemTypeService.updateItemType:", serviceError);
        return handleErrorClient(res, 400, serviceError);
      }

      console.log("Tipo de ítem actualizado exitosamente:", updatedItemType);
      handleSuccess(res, 200, "Tipo de ítem actualizado", updatedItemType);
    } catch (error) {
      console.error("Error en updateItemType catch:", error);
      handleErrorServer(res, 500, error.message);
    }
  },

  async deleteItemType(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        console.error("ID inválido:", id);
        return handleErrorClient(res, 400, "ID inválido");
      }

      const [result, error] = await itemTypeService.deleteItemType(id);
      if (error) {
        console.error("Error en itemTypeService.deleteItemType:", error);

        const status =
          error.type === "CONFLICT" ? 409
            : error.type === "NOT_FOUND" ? 404
              : 400;

        return handleErrorClient(res, status, error);
      }

      console.log("Tipo de ítem desactivado exitosamente:", id);
      handleSuccess(res, 200, "Tipo de ítem desactivado", result);
    } catch (error) {
      console.error("Error en deleteItemType catch:", error);
      handleErrorServer(res, 500, error.message);
    }
  },

  async restoreItemType(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        console.error("ID inválido:", id);
        return handleErrorClient(res, 400, "ID inválido");
      }

      const [restoredItemType, error] =
        await itemTypeService.restoreItemType(id);
      if (error) {
        console.error("Error en itemTypeService.restoreItemType:", error);
        return handleErrorClient(res, 404, error);
      }

      console.log("Tipo de ítem restaurado exitosamente:", restoredItemType);
      handleSuccess(res, 200, "Tipo de ítem restaurado", restoredItemType);
    } catch (error) {
      console.error("Error en restoreItemType catch:", error);
      handleErrorServer(res, 500, error.message);
    }
  },

  async getDeletedItemTypes(req, res) {
    try {
      const [deletedItemTypes, error] =
        await itemTypeService.getDeletedItemTypes();
      if (error) return handleErrorClient(res, 404, error);

      handleSuccess(
        res,
        200,
        "Tipos de ítem eliminados obtenidos",
        deletedItemTypes,
      );
    } catch (error) {
      console.error("Error en getDeletedItemTypes:", error);
      handleErrorServer(res, 500, error.message);
    }
  },

  async forceDeleteItemType(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return handleErrorClient(res, 400, "ID inválido");
      }

      const [result, error] = await itemTypeService.forceDeleteItemType(id);
      if (error) return handleErrorClient(res, 404, error);

      handleSuccess(res, 200, "Tipo de ítem eliminado permanentemente", result);
    } catch (error) {
      console.error("Error en forceDeleteItemType:", error);
      handleErrorServer(res, 500, error.message);
    }
  },

  async emptyTrash(req, res) {
    try {
      const [deletedItems, error] = await itemTypeService.emptyTrash();
      if (error) return handleErrorClient(res, 400, error);

      handleSuccess(res, 200, "Papelera vaciada", deletedItems);
    } catch (error) {
      console.error("Error en emptyTrash:", error);
      handleErrorServer(res, 500, error.message);
    }
  },

  async getStampingLevels(req, res) {
    try {
      const [levels, error] = await itemTypeService.getStampingLevels();
      if (error) return handleErrorClient(res, 404, error);
      
      handleSuccess(res, 200, "Niveles de estampado obtenidos", levels);
    } catch (error) {
      handleErrorServer(res, 500, error.message);
    }
  },
};
