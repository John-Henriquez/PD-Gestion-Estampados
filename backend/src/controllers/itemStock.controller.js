import { itemStockService } from "../services/itemStock.service.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";
import {
  itemStockSchema,
  itemStockUpdateSchema,
} from "../validations/itemStock.validation.js";

export const itemStockController = {
  async getItemStock(req, res) {
    try {
      const { id, itemTypeId, size, isActive } = req.query;

      if (itemTypeId && isNaN(parseInt(itemTypeId))) {
        return handleErrorClient(res, 400, "itemTypeId debe ser un número");
      }

      const [items, error] = await itemStockService.getItemStock({
        id: id ? parseInt(id) : undefined,
        size,
        isActive:
          isActive === "true" ? true : isActive === "false" ? false : undefined,
      });

      if (error) return handleErrorClient(res, 404, error);

      handleSuccess(res, 200, "Inventario obtenido", items);
    } catch (error) {
      console.error(
        "Error en getItemStock controller:",
        error.message,
        error.stack,
      );
      handleErrorServer(res, 500, "Error interno del servidor");
    }
  },

  async getPublicStock(req, res) {
    try {
      const { itemTypeId, size } = req.query;
      if (itemTypeId && isNaN(parseInt(itemTypeId))) {
        return handleErrorClient(res, 400, "itemTypeId debe ser un número");
      }

      const [items, error] = await itemStockService.getItemStock({
        publicOnly: true,
        itemTypeId: itemTypeId ? parseInt(itemTypeId) : undefined,
        size,
      });

      if (error) return handleErrorClient(res, 500, error);
      handleSuccess(res, 200, "Inventario público obtenido", items);
    } catch (error) {
      console.error(
        "Error en getPublicStock controller:",
        error.message,
        error.stack,
      );
      handleErrorServer(
        res,
        500,
        `Error interno del servidor: ${error.message}`,
      );
    }
  },

  async getPublicStockById(req, res) {
    try {
      const { id } = req.params;
      const parsedId = parseInt(id, 10);

      if (isNaN(parsedId)) {
        return handleErrorClient(
          res,
          400,
          "El ID del producto debe ser un número.",
        );
      }

      const [item, error] =
        await itemStockService.getPublicItemStockById(parsedId);

      if (error) {
        return handleErrorClient(res, 404, error);
      }
      handleSuccess(res, 200, "Detalles del producto obtenidos", item);
    } catch (error) {
      console.error(
        "Error en getPublicStockById controller:",
        error.message,
        error.stack,
      );
      handleErrorServer(
        res,
        500,
        "Error interno al obtener detalles del producto.",
      );
    }
  },

  async createItemStock(req, res) {
    try {
      const { error } = itemStockSchema.validate(req.body);
      if (error) {
        return handleErrorClient(res, 400, "Error de validación", error.details);
      }

      const [newItem, serviceError] = await itemStockService.createItemStock(
        req.body,
        req.user.id
      );

      if (serviceError) return handleErrorClient(res, 400, serviceError);

      const message = Array.isArray(req.body) 
        ? "Carga masiva de stock realizada" 
        : "Item creado en inventario";

      handleSuccess(res, 201, message, newItem);
    } catch (error) {
      handleErrorServer(res, 500, error.message);
    }
  },

  async updateItemStock(req, res) {
    try {
      const { id } = req.params;
      if (!id || isNaN(parseInt(id))) {
        return handleErrorClient(res, 400, "ID debe ser un número");
      }

      const { error } = itemStockUpdateSchema.validate(req.body);
      if (error) {
        return handleErrorClient(
          res,
          400,
          "Error de validación",
          error.details,
        );
      }

      const updateData = {
        ...req.body,
        updatedById: req.user.id,
      };

      const [updatedItem, serviceError] =
        await itemStockService.updateItemStock(
          parseInt(id),
          updateData,
          req.user.id,
        );
      if (serviceError) return handleErrorClient(res, 400, serviceError);

      handleSuccess(res, 200, "Item actualizado", updatedItem);
    } catch (error) {
      console.error(
        "Error en updateItemStock controller:",
        error.message,
        error.stack,
      );
      handleErrorServer(
        res,
        500,
        `Error interno del servidor: ${error.message}`,
      );
    }
  },

  async deleteItemStock(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!id || isNaN(parseInt(id))) {
        return handleErrorClient(res, 400, "ID debe ser un número");
      }

      if (!userId) {
        return handleErrorClient(res, 401, "Usuario no autenticado");
      }

      const [result, error] = await itemStockService.deleteItemStock(
        parseInt(id),
        userId,
      );

      if (error) {
        if (typeof error === "object" && error.errorCode) {
          return handleErrorClient(res, error.errorCode, error.message);
        }
        return handleErrorClient(res, 404, error);
      }

      handleSuccess(res, 200, result.message, { id: result.id });
    } catch (error) {
      handleErrorServer(res, 500, error.message);
    }
  },

  async emptyTrash(req, res) {
    try {
      const [deletedCount, error] = await itemStockService.emptyTrash(
        req.user.id,
      );
      if (error) return handleErrorClient(res, 500, error);

      handleSuccess(
        res,
        200,
        `Papelera vaciada. Items eliminados: ${deletedCount}`,
      );
    } catch (error) {
      handleErrorServer(res, 500, error.message);
    }
  },

  async restoreItemStock(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!id || isNaN(parseInt(id))) {
        return handleErrorClient(res, 400, "ID debe ser un número");
      }

      if (!userId) {
        return handleErrorClient(res, 401, "Usuario no autenticado");
      }
      const [restoredItem, error] = await itemStockService.restoreItemStock(
        parseInt(id),
        userId,
      );
      if (error) return handleErrorClient(res, 404, error);

      handleSuccess(res, 200, "Item restaurado", restoredItem);
    } catch (error) {
      handleErrorServer(res, 500, error.message);
    }
  },

  async forceDeleteItemStock(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return handleErrorClient(res, 400, "ID debe ser un número");
      }
      const userId = req.user?.id;
      if (!userId) {
        return handleErrorClient(res, 401, "Usuario no autenticado");
      }

      const [result, error] = await itemStockService.forceDeleteItemStock(
        parseInt(id),
        userId,
      );

      if (error) {
        if (error.includes("usado por uno o más packs")) {
          return handleErrorClient(res, 409, error);
        }
        return handleErrorClient(res, 404, error);
      }

      handleSuccess(res, 200, result.message, { id: result.id });
    } catch (error) {
      handleErrorServer(res, 500, error.message);
    }
  },

  async addStock(req, res) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      const userId = req.user?.id;

      if (!id || isNaN(parseInt(id))) {
        return handleErrorClient(res, 400, "ID debe ser un número");
      }

      if (!quantity || typeof quantity !== "number" || quantity <= 0) {
        return handleErrorClient(
          res,
          400,
          "La cantidad debe ser un número positivo",
        );
      }

      const [updatedItem, error] = await itemStockService.adjustStock(
        parseInt(id),
        quantity,
        userId,
      );

      if (error) return handleErrorClient(res, 400, error);

      handleSuccess(res, 200, "Stock añadido correctamente", updatedItem);
    } catch (error) {
      console.error(
        "Error en addStock controller:",
        error.message,
        error.stack,
      );
      handleErrorServer(res, 500, "Error interno del servidor");
    }
  },

  async removeStock(req, res) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      const userId = req.user?.id;

      if (!id || isNaN(parseInt(id))) {
        return handleErrorClient(res, 400, "ID debe ser un número");
      }

      if (!quantity || typeof quantity !== "number" || quantity <= 0) {
        return handleErrorClient(
          res,
          400,
          "La cantidad debe ser un número positivo",
        );
      }

      const [updatedItem, error] = await itemStockService.adjustStock(
        parseInt(id),
        -quantity,
        userId,
      );

      if (error) return handleErrorClient(res, 400, error);

      handleSuccess(res, 200, "Stock reducido correctamente", updatedItem);
    } catch (error) {
      console.error(
        "Error en removeStock controller:",
        error.message,
        error.stack,
      );
      handleErrorServer(res, 500, "Error interno del servidor");
    }
  },

  async restockVariants(req, res) {
    try {
      const restockData = req.body; 
      const userId = req.user.id;

      const dataToProcess = Array.isArray(restockData) ? restockData : [restockData];

      if (dataToProcess.length === 0) {
        return handleErrorClient(res, 400, "Se requiere información para procesar la recarga.");
      }

      const [updatedStocks, serviceError] = await itemStockService.restockVariants(
        restockData,
        userId
      );

      if (serviceError) {
        return handleErrorClient(res, 400, serviceError);
      }

      handleSuccess(res, 200, "Recarga de stock procesada exitosamente", updatedStocks);
    } catch (error) {
      console.error("Error en restockVariants controller:", error);
      handleErrorServer(res, 500, "Error interno al procesar la recarga");
    }
  },
};
