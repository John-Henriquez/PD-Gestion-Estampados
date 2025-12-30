"use strict";
import { AppDataSource } from "../config/configDb.js";
import Order from "../entity/order.entity.js";
import ItemStock from "../entity/itemStock.entity.js";
import User from "../entity/user.entity.js";
import { Between, LessThanOrEqual } from "typeorm";

export const reportService = {
  async getDashboardStats() {
    try {
      const orderRepository = AppDataSource.getRepository(Order);
      const stockRepository = AppDataSource.getRepository(ItemStock);
      const userRepository = AppDataSource.getRepository(User);

      const { totalSales } = await orderRepository
        .createQueryBuilder("order")
        .select("SUM(order.total)", "totalSales")
        .getRawOne();

      const lowStockCount = await stockRepository.count({
        where: { 
          quantity: LessThanOrEqual(5), 
          isActive: true 
        }
      });

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const ordersToday = await orderRepository.count({
        where: { createdAt: Between(todayStart, todayEnd) }
      });

      const totalCustomers = await userRepository.count({
        where: { rol: "cliente" }
      });

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const salesHistoryDailyRaw = await orderRepository
        .createQueryBuilder("order")
        .select("DATE(order.createdAt)", "date")
        .addSelect("SUM(order.total)", "amount")
        .where("order.createdAt >= :sevenDaysAgo", { sevenDaysAgo })
        .groupBy("DATE(order.createdAt)")
        .orderBy("date", "ASC")
        .getRawMany();

      const salesHistoryDaily = salesHistoryDailyRaw.map(item => ({
        date: new Date(item.date).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' }),
        amount: parseFloat(item.amount || 0)
      }));

      const salesHistoryTransactionsRaw = await orderRepository
        .createQueryBuilder("order")
        .select("order.createdAt", "date")
        .addSelect("order.total", "amount")
        .where("order.createdAt >= :sevenDaysAgo", { sevenDaysAgo })
        .orderBy("order.createdAt", "ASC")
        .getRawMany();

      const salesHistoryTransactions = salesHistoryTransactionsRaw.map(item => ({
        date: new Date(item.date).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' }),
        amount: parseFloat(item.amount || 0)
      }));

      const criticalItems = await stockRepository.find({
        where: { quantity: LessThanOrEqual(5), isActive: true },
        relations: ["itemType", "color"],
        take: 5
      });

      const criticalStock = criticalItems.map(item => ({
        name: `${item.itemType.name} (${item.size || item.color.name})`,
        quantity: item.quantity,
        minStock: item.minStock
      }));

      return [{
        kpis: {
          totalSales: parseFloat(totalSales || 0),
          ordersToday,
          lowStockCount,
          totalCustomers
        },
        salesHistoryDaily,
        salesHistoryTransactions,
        criticalStock
      }, null];
    } catch (error) {
      console.error("Error en reportService:", error);
      return [null, "Error al obtener estadísticas del servidor"];
    }
  },
  async getInventoryLossReport() {
    try {
      const movementRepository = AppDataSource.getRepository("InventoryMovement");
    
      const lossSummary = await movementRepository
        .createQueryBuilder("movement")
        .leftJoinAndSelect("movement.operation", "operation")
        .select("movement.reason", "reason")
        .addSelect("SUM(movement.quantity)", "quantity")
        .where("movement.type = :type", { type: 'Salida' })
        .andWhere("operation.slug IN (:...slugs)", { slugs: ['adjust_out', 'waste'] })
        .groupBy("movement.reason")
        .getRawMany();

      return [lossSummary, null];
    } catch (error) {
      console.error("Error en getInventoryLossReport:", error);
      return [null, "Error al obtener reporte de mermas"];
    }
  },
};