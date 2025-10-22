import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";
import { inventoryMovementService } from "../services/inventoryMovement.service.js";

export const inventoryMovementController = {
  async getInventoryMovements(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        type: req.query.type,
        itemStockId: req.query.itemStockId,
        createdBy: req.query.createdBy,
      };

      const [reportData, error] =
        await inventoryMovementService.getInventoryMovements(filters);
      if (error) return handleErrorClient(res, 400, error);

      handleSuccess(
        res,
        200,
        "Informe de movimientos de inventario obtenido",
        reportData,
      );
    } catch (error) {
      console.error("Error en getInventoryMovementsReport catch:", error);
      handleErrorServer(res, 500, error.message);
    }
  },
};
