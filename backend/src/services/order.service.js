// backend/src/services/order.service.js
import { AppDataSource } from "../config/configDb.js";
import Order from "../entity/order.entity.js";
import OrderItem from "../entity/orderItem.entity.js";
import ItemStock from "../entity/itemStock.entity.js";
import InventoryMovement from "../entity/InventoryMovementSchema.js";
import {
  createItemSnapshot,
  generateInventoryReason,
} from "../helpers/inventory.helpers.js";
import Pack from "../entity/pack.entity.js";
import User from "../entity/user.entity.js";

export const orderService = {
  async createOrder(orderData, userId) {
    return await AppDataSource.transaction(
      async (transactionalEntityManager) => {
        const orderRepo = transactionalEntityManager.getRepository(Order);
        const orderItemRepo =
          transactionalEntityManager.getRepository(OrderItem);
        const itemStockRepo =
          transactionalEntityManager.getRepository(ItemStock);
        const movementRepo =
          transactionalEntityManager.getRepository(InventoryMovement);
        const packRepo = transactionalEntityManager.getRepository(Pack);

        const { items, customerData } = orderData;

        if (!items || items.length === 0) {
          return [null, "El pedido debe contener al menos un artículo."];
        }

        let subtotal = 0;
        const itemsToUpdateStock = new Map();
        const orderItemsData = [];

        for (const itemInput of items) {
          let priceAtTime = 0;
          let itemNameSnapshot = "Artículo Desconocido";

          if (itemInput.itemStockId) {
            const stockItem = await itemStockRepo.findOne({
              where: { id: itemInput.itemStockId },
              relations: ["itemType"],
            });
            if (
              !stockItem ||
              !stockItem.isActive ||
              stockItem.quantity < itemInput.quantity
            ) {
              throw new Error(
                `Stock insuficiente o inválido para el producto: ${
                  stockItem?.itemType?.name || `ID ${itemInput.itemStockId}`
                }`,
              );
            }
            priceAtTime = stockItem.price;
            itemNameSnapshot =
              stockItem.itemType?.name || `Stock ID ${stockItem.id}`; // Usa el nombre del tipo
            subtotal += priceAtTime * itemInput.quantity;
            itemsToUpdateStock.set(
              stockItem.id,
              (itemsToUpdateStock.get(stockItem.id) || 0) + itemInput.quantity,
            );

            orderItemsData.push({
              itemStock: { id: stockItem.id },
              pack: null,
              quantity: itemInput.quantity,
              priceAtTimeOfOrder: priceAtTime,
              itemNameSnapshot: itemNameSnapshot,
              stampImageUrl: itemInput.stampImageUrl || null,
              stampInstructions: itemInput.stampInstructions || null,
            });
          } else if (itemInput.packId) {
            const pack = await packRepo.findOne({
              where: { id: itemInput.packId, isActive: true },
              relations: [
                "packItems",
                "packItems.itemStock",
                "packItems.itemStock.itemType",
              ],
            });
            if (!pack || !pack.isActive) {
              throw new Error(
                `Pack no encontrado o inactivo: ID ${itemInput.packId}`,
              );
            }
            priceAtTime = pack.price;
            itemNameSnapshot = `Pack: ${pack.name}`;
            subtotal += priceAtTime * itemInput.quantity;

            for (const packItem of pack.packItems) {
              if (
                !packItem.itemStock ||
                !packItem.itemStock.isActive ||
                packItem.itemStock.quantity <
                  packItem.quantity * itemInput.quantity
              ) {
                throw new Error(
                  `Stock insuficiente para "${
                    packItem.itemStock?.itemType?.name || "item"
                  }" dentro del pack "${pack.name}"`,
                );
              }
              const quantityToDecrement =
                packItem.quantity * itemInput.quantity;
              itemsToUpdateStock.set(
                packItem.itemStock.id,
                (itemsToUpdateStock.get(packItem.itemStock.id) || 0) +
                  quantityToDecrement,
              );
            }

            orderItemsData.push({
              itemStock: null,
              pack: { id: pack.id },
              quantity: itemInput.quantity,
              priceAtTimeOfOrder: priceAtTime,
              itemNameSnapshot: itemNameSnapshot,
              stampImageUrl: itemInput.stampImageUrl || null,
              stampInstructions: itemInput.stampInstructions || null,
            });
          } else {
            throw new Error(
              "Cada item del pedido debe tener 'itemStockId' o 'packId'.",
            );
          }
        }

        const total = subtotal;

        const newOrder = orderRepo.create({
          status: "pendiente",
          subtotal,
          total,
          user: userId ? { id: userId } : null,
          guestEmail: !userId ? customerData?.email : null,
          customerName: customerData?.name || null,
        });
        const savedOrder = await orderRepo.save(newOrder);

        const orderItemEntities = orderItemsData.map((itemData) =>
          orderItemRepo.create({
            ...itemData,
            priceAtTime: itemData.priceAtTimeOfOrder,
            order: { id: savedOrder.id },
          }),
        );
        await orderItemRepo.save(orderItemEntities);

        for (const [
          stockId,
          quantityToDecrement,
        ] of itemsToUpdateStock.entries()) {
          await itemStockRepo.decrement(
            { id: stockId },
            "quantity",
            quantityToDecrement,
          );

          const stockItemForSnapshot = await itemStockRepo.findOne({
            where: { id: stockId },
            relations: ["itemType"],
          });

          const { operation, reason } = generateInventoryReason("sale");
          await movementRepo.save({
            type: "salida",
            operation,
            reason: `${reason} (Pedido #${savedOrder.id})`,
            quantity: quantityToDecrement,
            itemStock: { id: stockId },
            createdBy: userId ? { id: userId } : null,
            order: { id: savedOrder.id },
            ...createItemSnapshot(stockItemForSnapshot || { id: stockId }),
          });
        }

        // Devolver la orden completa con sus items
        const finalOrder = await orderRepo.findOne({
          where: { id: savedOrder.id },

          relations: [
            "user",
            "orderItems",
            "orderItems.itemStock",
            "orderItems.itemStock.itemType",
            "orderItems.pack",
          ],
        });

        return [finalOrder, null];
      },
    ).catch((error) => {
      console.error("Error en la transacción de creación de pedido:", error);
      return [null, error.message || "Error interno al procesar el pedido."];
    });
  },

  async getOrders(userId, isAdminUser = false) {
    try {
      const orderRepo = AppDataSource.getRepository(Order);
      let whereClause = {};

      if (!isAdminUser) {
        if (!userId) {
          return [
            null,
            "Se requiere identificación del usuario para obtener sus pedidos.",
          ];
        }
        whereClause = { user: { id: userId } };
      }

      const orders = await orderRepo.find({
        where: whereClause,
        relations: [
          "user",
          "orderItems",
          "orderItems.itemStock",
          "orderItems.itemStock.itemType",
          "orderItems.pack",
        ],
        order: { createdAt: "DESC" },
      });

      return [orders, null];
    } catch (error) {
      console.error("Error en getOrders service:", error);
      return [null, "Error al obtener los pedidos."];
    }
  },

  async getOrderById(
    orderId,
    userId,
    isAdminUser = false,
    userEmailForGuestCheck = null,
  ) {
    try {
      const orderRepo = AppDataSource.getRepository(Order);
      const order = await orderRepo.findOne({
        where: { id: orderId },
        relations: [
          "user",
          "orderItems",
          "orderItems.itemStock",
          "orderItems.itemStock.itemType",
          "orderItems.pack",
          "orderItems.pack.packItems",
          "orderItems.pack.packItems.itemStock",
          "orderItems.pack.packItems.itemStock.itemType",
        ],
      });

      if (!order) {
        return [null, "Pedido no encontrado."];
      }

      let canView = isAdminUser;

      if (!canView && order.user && order.user.id === userId) {
        canView = true;
      }

      if (
        !canView &&
        !order.user &&
        order.guestEmail &&
        userEmailForGuestCheck &&
        order.guestEmail.toLowerCase() === userEmailForGuestCheck.toLowerCase()
      ) {
        canView = true;
      }

      if (!canView) {
        return [null, "No tienes permiso para ver este pedido."];
      }

      return [order, null];
    } catch (error) {
      console.error("Error en getOrderById service:", error);
      return [null, "Error al obtener el detalle del pedido."];
    }
  },

  async updateOrderStatus(orderId, newStatus, adminUserId) {
    try {
      const orderRepo = AppDataSource.getRepository(Order);
      const order = await orderRepo.findOneBy({ id: orderId });

      if (!order) {
        return [null, "Pedido no encontrado."];
      }

      const allowedStatus = [
        "pendiente",
        "pagado",
        "procesando",
        "enviado",
        "entregado",
        "cancelado",
        "fallido",
      ];
      if (!allowedStatus.includes(newStatus)) {
        return [null, `Estado inválido: ${newStatus}`];
      }

      order.status = newStatus;

      const updatedOrder = await orderRepo.save(order);

      return [updatedOrder, null];
    } catch (error) {
      console.error("Error en updateOrderStatus service:", error);
      return [null, "Error al actualizar el estado del pedido."];
    }
  },
};
