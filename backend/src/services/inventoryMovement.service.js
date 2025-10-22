import { AppDataSource } from "../config/configDb.js";
import { Between } from "typeorm";
import InventoryMovement from "../entity/InventoryMovementSchema.js";

export const inventoryMovementService = {
  async getInventoryMovements(filters) {
    try {
      const repo = AppDataSource.getRepository(InventoryMovement);

      const where = {};

      if (filters.startDate && filters.endDate) {
        where.createdAt = Between(
          new Date(filters.startDate),
          new Date(filters.endDate),
        );
      }

      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.itemStockId) {
        where.itemStock = { id: parseInt(filters.itemStockId) };
      }

      if (filters.createdBy) {
        where.createdBy = { id: parseInt(filters.createdBy) };
      }

      const movements = await repo.find({
        where,
        relations: ["itemStock", "createdBy"],
        order: { createdAt: "DESC" },
      });

      const totals = movements.reduce((acc, mov) => {
        acc[mov.type] = (acc[mov.type] || 0) + mov.quantity;
        return acc;
      }, {});

      return [{ movements, totals }, null];
    } catch (error) {
      console.error("Error en getInventoryMovementsReport:", error);
      return [null, "Error al obtener informe de movimientos de inventario"];
    }
  },
};
