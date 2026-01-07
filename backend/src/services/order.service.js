import { AppDataSource } from "../config/configDb.js";
import Order from "../entity/order.entity.js";
import OrderItem from "../entity/orderItem.entity.js";
import ItemStock from "../entity/itemStock.entity.js";
import InventoryMovement from "../entity/InventoryMovementSchema.js";
import Pack from "../entity/pack.entity.js";
import OrderStatus from "../entity/orderStatus.entity.js";
import Operation from "../entity/inventoryOperation.entity.js";
import {
  createItemSnapshot,
  generateInventoryReason,
} from "../helpers/inventory.helpers.js";
import {
  sendOrderCancelledEmail,
  sendOrderCompletedEmail,
  sendOrderCreatedEmail,
  sendOrderPaidEmail,
  sendOrderShippedEmail,
} from "./email.service.js";

export const orderService = {
  async createOrder(orderData, userId) {
    return await AppDataSource.transaction(
      async (transactionalEntityManager) => {
        const orderRepo = transactionalEntityManager.getRepository(Order);
        const movementRepo = transactionalEntityManager.getRepository(InventoryMovement);
        const operationRepo = transactionalEntityManager.getRepository(Operation);
        const orderItemRepo = transactionalEntityManager.getRepository(OrderItem);
        const itemStockRepo = transactionalEntityManager.getRepository(ItemStock);
        const packRepo = transactionalEntityManager.getRepository(Pack);
        const statusRepo = transactionalEntityManager.getRepository(OrderStatus);

        const { items, customerData, shippingAddress, customerPhone } = orderData;

        if (!items || items.length === 0) return [null, "El pedido debe contener al menos un artículo."];
        
        const initialStatus = await statusRepo.findOne({ where: { name: "pendiente_de_pago" } });
        if (!initialStatus) throw new Error("Estado inicial 'pendiente_de_pago' no configurado.");

        let calculatedSubtotal = 0;
        const itemsToUpdateStock = new Map();
        const orderItemsData = [];

        for (const itemInput of items) {
          const selectedLevelObject = itemInput.stampOptionsSnapshot || null;
          
          let itemNameSnapshot = "Artículo Desconocido";
          let sizeSnapshot = null;
          let colorHexSnapshot = null;
          let colorNameSnapshot = null;

          if (itemInput.itemStockId) {
            const stockItem = await itemStockRepo.findOne({
              where: { id: itemInput.itemStockId },
              relations: ["itemType", "color"],
            });
            if (!stockItem || !stockItem.isActive || stockItem.quantity < itemInput.quantity) {
              throw new Error(
                `Stock insuficiente o inválido para el producto: ${
                  stockItem?.itemType?.name || `ID ${itemInput.itemStockId}`
                }`,
              );
            }

            sizeSnapshot = stockItem.size;
            colorHexSnapshot = stockItem.color?.hex || stockItem.hexColor;
            colorNameSnapshot = stockItem.color?.name || stockItem.colorName;
            itemNameSnapshot = stockItem.itemType?.name;

            const isStampable =
              stockItem.itemType.category === "clothing" || 
              stockItem.itemType.category === "object";

            if (isStampable && (!selectedLevelObject || typeof selectedLevelObject.price !== "number")) {
              throw new Error(
                `El item ${itemNameSnapshot}
                es estampable pero no se envió un nivel de estampado (StampingLevel) válido.`
              );
            }

            const priceAtTime = selectedLevelObject ? selectedLevelObject.price : 0;
            calculatedSubtotal += priceAtTime * itemInput.quantity;

            itemsToUpdateStock.set(
              stockItem.id,
              (itemsToUpdateStock.get(stockItem.id) || 0) + itemInput.quantity,
            );

            orderItemsData.push({
              itemStock: { id: stockItem.id },
              pack: null,
              quantity: itemInput.quantity,
              priceAtTime: priceAtTime,
              itemNameSnapshot,
              sizeSnapshot,
              colorHexSnapshot,
              colorNameSnapshot,
              stampOptionsSnapshot: selectedLevelObject,
              stampImageUrl: itemInput.stampImageUrl || null,
              stampInstructions: itemInput.stampInstructions || null,
            });

          } else if (itemInput.packId) {
            const pack = await packRepo.findOne({
              where: { id: itemInput.packId, isActive: true },
              relations: ["packItems", "packItems.itemStock", "packItems.itemStock.itemType"],
            });

            if (!pack) throw new Error(`Pack ID ${itemInput.packId} no encontrado.`);

            calculatedSubtotal += parseFloat(pack.price) * itemInput.quantity;

            for (const pItem of pack.packItems) {
              const totalRequired = pItem.quantity * itemInput.quantity;
              if (pItem.itemStock.quantity < totalRequired) {
                throw new Error(`Stock insuficiente en pack para ${pItem.itemStock.itemType.name}`);
              }
              itemsToUpdateStock.set(
                pItem.itemStock.id,
                (itemsToUpdateStock.get(pItem.itemStock.id) || 0) + totalRequired,
              );
            }

            orderItemsData.push({
              itemStock: null,
              pack: { id: pack.id },
              quantity: itemInput.quantity,
              priceAtTime: parseFloat(pack.price),
              itemNameSnapshot: `Pack: ${pack.name}`,
              stampOptionsSnapshot: null
            });
          }
        }

        const newOrder = orderRepo.create({
          status: initialStatus,
          total: calculatedSubtotal,
          subtotal: calculatedSubtotal,
          user: userId ? { id: userId } : null,
          guestEmail: !userId ? customerData?.email : null,
          customerName: customerData?.name || null,
          customerPhone: customerPhone,
          shippingAddress: shippingAddress,
        });
        const savedOrder = await orderRepo.save(newOrder);

        const itemEntities = orderItemsData.map(d => orderItemRepo.create({ ...d, order: savedOrder }));
        await orderItemRepo.save(itemEntities);

        const operationEntity = await operationRepo.findOneBy({ slug: "sale" });
        if (!operationEntity) throw new Error("Operación 'sale' no encontrada.");

        for (const [stockId, qty] of itemsToUpdateStock.entries()) {
          await itemStockRepo.decrement({ id: stockId }, "quantity", qty);

          const stockItemForSnapshot = await itemStockRepo.findOne({
            where: { id: stockId }, 
            relations: ["itemType", "color"]
          });

          const { reason: helperReason } = generateInventoryReason("sale");

          await movementRepo.save({
            type: "salida",
            operation: operationEntity,
            reason: `${helperReason} (Pedido #${savedOrder.id})`,
            quantity: qty,
            itemStock: { id: stockId },
            createdBy: userId ? { id: userId } : null,
            order: { id: savedOrder.id },
            ...createItemSnapshot(stockItemForSnapshot || { id: stockId }),
          });
        }

        const finalOrder = await orderRepo.findOne({
          where: { id: savedOrder.id },
          relations: [
            "status",
            "user",
            "orderItems",
            "orderItems.itemStock",
            "orderItems.itemStock.itemType",
            "orderItems.itemStock.color",
            "orderItems.pack",
          ],
        });

        // ENVIO DE CORREO: CREACIÓN
        try {
          if (finalOrder) {
            await sendOrderCreatedEmail(finalOrder);
          }
        } catch (emailErr) {
          console.error("Error al enviar correo inicial:", emailErr);
        }
        return [finalOrder, null];
      },
    ).catch((error) => {
      console.error("Error en transacción createOrder:", error);
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
          "status",
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
          "status",
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

  async updateOrderStatus(orderId, newStatusName, adminUserId) {
    return await AppDataSource.transaction(
      async (transactionalEntityManager) => {
        const orderRepo = transactionalEntityManager.getRepository(Order);
        const movementRepo = transactionalEntityManager.getRepository(InventoryMovement);
        const itemStockRepo = transactionalEntityManager.getRepository(ItemStock);
        const operationRepo = transactionalEntityManager.getRepository(Operation);
        const statusRepo = transactionalEntityManager.getRepository(OrderStatus);

        const order = await orderRepo.findOne({
          where: { id: orderId },
          relations: [
            "status",
            "user", 
            "orderItems", 
            "orderItems.itemStock",
            "orderItems.itemStock.itemType",
            "orderItems.pack",
            "orderItems.pack.packItems",
            "orderItems.pack.packItems.itemStock",
            "orderItems.pack.packItems.itemStock.itemType"
          ]
        });

        if (!order) throw new Error("Pedido no encontrado.");

        const targetStatus = await statusRepo.findOneBy({ name: newStatusName });
        if (!targetStatus) throw new Error(`Estado inválido: ${newStatusName}`);

        if (order.status?.id === targetStatus.id) {
          return [order, null];
        }

        const changes = {};
        let requiresAuditLog = false;
        
       changes.status = {
          oldValue: order.status.name,
          newValue: targetStatus.name,
        };

        
        if (newStatusName === "cancelado" && order.status.name !== "cancelado") {
            const returnOp = await operationRepo.findOneBy({ slug: "return" });
            if (!returnOp) throw new Error("Operación 'return' no encontrada.");

            for (const item of order.orderItems) {
              if (item.itemStock) {
                await itemStockRepo.increment({ id: item.itemStock.id }, "quantity", item.quantity);
                const { reason: helperReason } = generateInventoryReason("return");
                await movementRepo.save({
                  type: "entrada",
                  operation: returnOp,
                  reason: `${helperReason} (Cancelación Pedido #${order.id})`,
                  quantity: item.quantity,
                  itemStock: item.itemStock,
                  createdBy: { id: adminUserId },
                  order: { id: order.id },
                  ...createItemSnapshot(item.itemStock)
                });
              } 
              else if (item.pack) {
              for (const packItem of item.pack.packItems) {
                const quantityToRestore = item.quantity * packItem.quantity;
                await itemStockRepo.increment({ id: packItem.itemStock.id }, "quantity", quantityToRestore);
                const { reason: helperReason } = generateInventoryReason("return");
                await movementRepo.save({
                  type: "entrada",
                  operation: returnOp,
                  reason: `${helperReason} (Cancelación Pack en Pedido #${order.id})`,
                  quantity: quantityToRestore,
                  itemStock: packItem.itemStock,
                  createdBy: adminUserId ? { id: adminUserId } : null,
                  order: { id: order.id },
                  ...createItemSnapshot(packItem.itemStock)
                });
              }
            }
          }
        }

        if (newStatusName === "en_proceso" && !order.paymentDate) {
            order.paymentDate = new Date();
            changes.paymentDate = { oldValue: null, newValue: order.paymentDate };
            if (!order.paymentMethod) {
              order.paymentMethod = "Confirmado por Sistema";
            }
          }

        order.status = targetStatus;
        requiresAuditLog = true;
        order.updatedAt = new Date();

        const updatedOrder = await orderRepo.save(order);

        const operation = await operationRepo.findOneBy({ slug: "update_info" });
        if (requiresAuditLog && operation) {
          const { reason: helperReason } = generateInventoryReason("update_info");
          await movementRepo.save({
            type: "ajuste",
            operation: operation,
            reason: helperReason,
            quantity: 0,
            order: updatedOrder,
            createdBy: { id: adminUserId },
            changes: changes,
            snapshotItemName: `Pedido #${orderId}`,
          });
        }
        
        try {
          const emailMap = {
            en_proceso: sendOrderPaidEmail,
            enviado: sendOrderShippedEmail,
            completado: sendOrderCompletedEmail,
            cancelado: sendOrderCancelledEmail
          };

          if (emailMap[newStatusName]) {
            await emailMap[newStatusName](updatedOrder);
          }
        } catch (emailErr) {
          console.error(`⚠️ Error enviando correo para ${newStatusName}:`, emailErr);
        }

        return [updatedOrder, null];
      }
    ).catch((error) => {
      console.error(`Error updateOrderStatus pedido ${orderId}:`, error);
      return [null, error.message || "Error al actualizar el pedido."];
    });
  },
};