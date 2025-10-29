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

        let calculatedSubtotal = 0;
        const itemsToUpdateStock = new Map();
        const orderItemsData = [];

        for (const itemInput of items) {
          let calculatedPriceForItem = 0;
          let basePrice = 0;
          let itemNameSnapshot = "Artículo Desconocido";
          let selectedOptionsSnapshot = itemInput.selectedStampOptions || null;

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

            basePrice = stockItem.price;
            calculatedPriceForItem = basePrice;
            itemNameSnapshot =
              stockItem.itemType?.name || `Stock ID ${stockItem.id}`;

            if (
              stockItem.stampOptionsPricing &&
              selectedOptionsSnapshot &&
              typeof selectedOptionsSnapshot === "object"
            ) {
              console.log(
                "Calculando costo de estampado para ${itemNameSnapshot}",
                selectedOptionsSnapshot,
              );
              console.log(
                "Precios disponibles:",
                stockItem.stampOptionsPricing,
              );

              // Costo por ubicación (ej: 'front', 'back')
              if (
                selectedOptionsSnapshot.location &&
                stockItem.stampOptionsPricing.locations
              ) {
                const locationCost =
                  stockItem.stampOptionsPricing.locations[
                    selectedOptionsSnapshot.location
                  ];
                if (typeof locationCost === "number" && locationCost > 0) {
                  calculatedPriceForItem += locationCost;
                  console.log(
                    `+ Costo por ubicación (${selectedOptionsSnapshot.location}): ${locationCost}`,
                  );
                } else {
                  console.warn(
                    `Opción de ubicación '${selectedOptionsSnapshot.location}' ` +
                      "seleccionada pero sin costo definido o inválido.",
                  );
                  throw new Error(
                    `Costo no definido para la ubicación de estampado '${selectedOptionsSnapshot.location}'`,
                  );
                }
              }

              if (
                selectedOptionsSnapshot.type &&
                stockItem.stampOptionsPricing.types
              ) {
                const typeCost =
                  stockItem.stampOptionsPricing.types[
                    selectedOptionsSnapshot.type
                  ];
                if (typeof typeCost === "number" && typeCost > 0) {
                  calculatedPriceForItem += typeCost;
                  console.log(
                    `+ Costo por tipo (${selectedOptionsSnapshot.type}): ${typeCost}`,
                  );
                } else {
                  console.warn(
                    `Opción de tipo '${selectedOptionsSnapshot.type}' ` +
                      "seleccionada pero sin costo definido o inválido.",
                  );

                  // Opcional: lanzar error
                  throw new Error(
                    `Costo no definido para el tipo de estampado '${selectedOptionsSnapshot.type}'`,
                  );
                }
              }
              console.log(
                `Precio recalculado para ${itemNameSnapshot}: ${calculatedPriceForItem}`,
              );
            }

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

  async updateOrderStatus(orderId, updateData, adminUserId) {
    return await AppDataSource.transaction(
      async (transactionalEntityManager) => {
        const orderRepo = transactionalEntityManager.getRepository(Order);
        const movementRepo =
          transactionalEntityManager.getRepository(InventoryMovement);

        const order = await orderRepo.findOneBy({ id: orderId });

        if (!order) {
          throw new Error("Pedido no encontrado.");
        }

        const changes = {};
        let requiresAuditLog = false;

        if (updateData.status && updateData.status !== order.status) {
          const allowedGeneralStatus = [
            "pendiente",
            "confirmado",
            "procesando",
            "listo_para_retiro",
            "enviado",
            "entregado",
            "cancelado",
            "fallido",
          ];
          if (!allowedGeneralStatus.includes(updateData.status)) {
            throw new Error(`Estado general inválido: ${updateData.status}`);
          }
          changes.status = {
            oldValue: order.status,
            newValue: updateData.status,
          };
          order.status = updateData.status;
          requiresAuditLog = true;
        }

        if (
          updateData.paymentStatus &&
          updateData.paymentStatus !== order.paymentStatus
        ) {
          const allowedPaymentStatus = [
            "pendiente_anticipo",
            "anticipo_pagado",
            "pagado_completo",
            "reembolsado",
            "pago_fallido",
          ];
          if (!allowedPaymentStatus.includes(updateData.paymentStatus)) {
            throw new Error(
              `Estado de pago inválido: ${updateData.paymentStatus}`,
            );
          }
          changes.paymentStatus = {
            oldValue: order.paymentStatus,
            newValue: updateData.paymentStatus,
          };
          order.paymentStatus = updateData.paymentStatus;
          requiresAuditLog = true;

          if (updateData.paymentStatus === "anticipo_pagado") {
            if (
              updateData.amountPaid === undefined &&
              order.amountPaid < order.advancePaymentRequired
            ) {
              changes.amountPaid = {
                oldValue: order.amountPaid,
                newValue: order.advancePaymentRequired,
              };
              order.amountPaid = order.advancePaymentRequired;
            }
            if (!changes.status && order.status === "pendiente") {
              changes.status = {
                oldValue: order.status,
                newValue: "procesando",
              };
              order.status = "procesando";
            }
          } else if (updateData.paymentStatus === "pagado_completo") {
            if (
              updateData.amountPaid === undefined &&
              order.amountPaid < order.total
            ) {
              changes.amountPaid = {
                oldValue: order.amountPaid,
                newValue: order.total,
              };
              order.amountPaid = order.total;
            }
          }
        }

        if (
          updateData.amountPaid !== undefined &&
          updateData.amountPaid !== order.amountPaid
        ) {
          const newAmountPaid = Number(updateData.amountPaid);
          if (
            isNaN(newAmountPaid) ||
            newAmountPaid < 0 ||
            newAmountPaid > order.total
          ) {
            throw new Error(
              `Monto pagado inválido: ${updateData.amountPaid}. ` +
                `Debe ser un número entre 0 y ${order.total}.`,
            );
          }
          if (newAmountPaid !== order.amountPaid) {
            changes.amountPaid = {
              oldValue: order.amountPaid,
              newValue: newAmountPaid,
            };
            order.amountPaid = newAmountPaid;
            requiresAuditLog = true;
          }

          if (!changes.paymentStatus) {
            if (
              newAmountPaid >= order.total &&
              order.paymentStatus !== "pagado_completo"
            ) {
              changes.paymentStatus = {
                oldValue: order.paymentStatus,
                newValue: "pagado_completo",
              };
              order.paymentStatus = "pagado_completo";
            } else if (
              newAmountPaid >= order.advancePaymentRequired &&
              order.paymentStatus === "pendiente_anticipo"
            ) {
              changes.paymentStatus = {
                oldValue: order.paymentStatus,
                newValue: "anticipo_pagado",
              };
              order.paymentStatus = "anticipo_pagado";
              if (!changes.status && order.status === "pendiente") {
                changes.status = {
                  oldValue: order.status,
                  newValue: "procesando",
                };
                order.status = "procesando";
              }
            } else if (
              newAmountPaid < order.advancePaymentRequired &&
              order.paymentStatus !== "pendiente_anticipo"
            ) {
              changes.paymentStatus = {
                oldValue: order.paymentStatus,
                newValue: "pendiente_anticipo",
              };
              order.paymentStatus = "pendiente_anticipo";
            }
          }
        }

        if (
          updateData.paymentMethod &&
          updateData.paymentMethod !== order.paymentMethod
        ) {
          changes.paymentMethod = {
            oldValue: order.paymentMethod,
            newValue: updateData.paymentMethod,
          };
          order.paymentMethod = updateData.paymentMethod;
          order.paymentDate = new Date();
          changes.paymentDate = {
            oldValue: order.paymentDate,
            newValue: order.paymentDate,
          };
          requiresAuditLog = true;
        } else if (changes.amountPaid || changes.paymentStatus) {
          const newPaymentDate = new Date();
          if (
            !order.paymentDate ||
            order.paymentDate.getTime() !== newPaymentDate.getTime()
          ) {
            changes.paymentDate = {
              oldValue: order.paymentDate,
              newValue: newPaymentDate,
            };
            order.paymentDate = newPaymentDate;
          }
        }

        if (Object.keys(changes).length === 0) {
          console.log(`No se realizaron cambios en el pedido ID ${orderId}`);
          return [order, null];
        }

        order.updatedAt = new Date();

        const updatedOrder = await orderRepo.save(order);

        if (requiresAuditLog) {
          const { operation, reason } = generateInventoryReason("update");
          await movementRepo.save({
            type: "modificacion",
            operation: "update_order",
            reason: `Actualización de estado/pago del pedido #${orderId}`,
            quantity: 0,
            order: updatedOrder,
            createdBy: { id: adminUserId },
            changes: changes,
            snapshotItemName: `Pedido #${orderId}`,
          });
        }

        return [updatedOrder, null];
      },
    ).catch((error) => {
      console.error(
        `Error en la transacción de updateOrderStatus para pedido ${orderId}:`,
        error,
      );
      return [
        null,
        error.message ||
          "Error interno al actualizar el estado/pago del pedido.",
      ];
    });
  },
};
