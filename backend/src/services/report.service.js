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
      const orderItemRepository = AppDataSource.getRepository("OrderItem")

      // 1. KPIs Financieros y Clientes
      const financialStats = await orderRepository
        .createQueryBuilder("order")
        .select("SUM(order.total)", "totalSales")
        .addSelect("AVG(order.total)", "averageTicket")
        .addSelect("COUNT(order.id)", "totalOrders")
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

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const salesHistoryDailyRaw = await orderRepository
        .createQueryBuilder("order")
        .select("DATE(order.createdAt)", "date")
        .addSelect("SUM(order.total)", "amount")
        .where("order.createdAt >= :sevenDaysAgo", { sevenDaysAgo })
        .groupBy("DATE(order.createdAt)")
        .orderBy("date", "ASC")
        .getRawMany();

      // 2. Historial de ventas diarias
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

      // 3. Productos más vendidos
      const topProductsRaw = await AppDataSource.query(`
        SELECT name, size, color_name, SUM(quantity) as total_sold
        FROM (
          -- Ítems vendidos solos
          SELECT t.name, s.size, c.name as color_name, oi.quantity
          FROM order_items oi
          JOIN item_stocks s ON oi.item_stock_id = s.id
          JOIN item_types t ON s."itemTypeId" = t.id
          LEFT JOIN colors c ON s.color_id = c.id
          WHERE oi.item_stock_id IS NOT NULL

          UNION ALL

          -- Ítems vendidos dentro de un pack
          SELECT t.name, s.size, c.name as color_name, (oi.quantity * pi.quantity) as quantity
          FROM order_items oi
          JOIN packs p ON oi.pack_id = p.id
          JOIN pack_items pi ON p.id = pi.pack_id
          JOIN item_stocks s ON pi.item_stock_id = s.id
          JOIN item_types t ON s."itemTypeId" = t.id
          LEFT JOIN colors c ON s.color_id = c.id
          WHERE oi.pack_id IS NOT NULL
        ) as combined_sales
        GROUP BY name, size, color_name
        ORDER BY total_sold DESC
        LIMIT 5
      `);

      const topProducts = topProductsRaw.map(p => ({
        name: `${p.name}${p.size ? ` (${p.size})` : ''}${p.color_name ? ` - ${p.color_name}` : ''}`,
        totalQty: parseInt(p.total_sold) || 0
      }));


      // 4. Distribución por Categoría 
      const categoryStats = await AppDataSource.query(`
        SELECT category_key, SUM(quantity) as total_qty
        FROM (
          SELECT t.category as category_key, oi.quantity
          FROM order_items oi
          JOIN item_stocks s ON oi.item_stock_id = s.id
          JOIN item_types t ON s."itemTypeId" = t.id
          WHERE oi.item_stock_id IS NOT NULL

          UNION ALL

          SELECT t.category as category_key, (oi.quantity * pi.quantity) as quantity
          FROM order_items oi
          JOIN packs p ON oi.pack_id = p.id
          JOIN pack_items pi ON p.id = pi.pack_id
          JOIN item_stocks s ON pi.item_stock_id = s.id
          JOIN item_types t ON s."itemTypeId" = t.id
          WHERE oi.pack_id IS NOT NULL
        ) as combined_categories
        GROUP BY category_key
      `);

      const categoryMap = { clothing: "Ropa", object: "Objetos" };
      const formattedCategoryData = categoryStats.map(c => ({
        name: categoryMap[c.category_key] || c.category_key,
        value: parseInt(c.total_qty) || 0
      }));

      return [{
        kpis: {
          totalSales: parseFloat(financialStats.totalSales || 0),
          averageTicket: Math.round(parseFloat(financialStats.averageTicket || 0)),
          ordersToday,
          lowStockCount,
          totalCustomers,
          totalOrders: parseInt(financialStats.totalOrders || 0)
        },
        salesHistoryDaily,
        topProducts,
        categoryDistribution: formattedCategoryData
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
        .leftJoin("movement.operation", "operation") 
        .select("movement.reason", "reason")
        .addSelect("SUM(movement.quantity)", "quantity")
        .where("movement.type = :type", { type: 'Salida' })
        .andWhere("operation.slug IN (:...slugs)", { slugs: ['adjust_out', 'waste', 'deactivate'] })
        .groupBy("movement.reason")
        .getRawMany();

      return [lossSummary.map(l => ({ 
        reason: l.reason, 
        quantity: Math.abs(parseInt(l.quantity)) 
      })), null];
    } catch (error) {
      console.error("Error en getInventoryLossReport:", error);
      return [null, "Error al obtener reporte de mermas"];
    }
  },
};