import { AppDataSource } from "../config/configDb.js";
import { Between } from "typeorm";
import InventoryMovement from "../entity/InventoryMovementSchema.js";

export const inventoryMovementService = {
  async getInventoryMovements(filters) {
    try {
      const repo = AppDataSource.getRepository(InventoryMovement);
      const where = {};

      // 1. Filtros
      if (filters.startDate && filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt = Between(new Date(filters.startDate), end);
      }

      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.operationSlug) {
        where.operation = { slug: filters.operationSlug };
      }

      if (filters.itemStockId) {
        where.itemStock = { id: parseInt(filters.itemStockId) };
      }

      if (filters.createdBy) {
        where.createdBy = { id: parseInt(filters.createdBy) };
      }

      // 2. Consulta
      const movements = await repo.find({
        where,
        relations: [
          "operation",  
          "itemStock", 
          "itemStock.itemType", 
          "itemStock.color",
          "createdBy",
          "order"        
        ],
        order: { createdAt: "DESC" },
      });

      // 3. Totales
      const totals = movements.reduce((acc, mov) => {
        acc.byType[mov.type] = (acc.byType[mov.type] || 0) + mov.quantity;
        const opName = mov.operation?.name || "Otras";
        acc.byOperation[opName] = (acc.byOperation[opName] || 0) + mov.quantity;
        return acc;
      }, { byType: {}, byOperation: {} });

      return [{ movements, totals }, null];
    } catch (error) {
      console.error("Error en getInventoryMovements [Service]:", error);
      return [null, "Error al obtener informe de movimientos de inventario"];
    }
  },
};
