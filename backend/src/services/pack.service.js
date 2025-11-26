import { AppDataSource } from "../config/configDb.js";
import Pack from "../entity/pack.entity.js";
import PackItem from "../entity/packItem.entity.js";
import ItemStock from "../entity/itemStock.entity.js";
import InventoryMovement from "../entity/InventoryMovementSchema.js";
import {
  createItemSnapshot,
  generateInventoryReason,
} from "../helpers/inventory.helpers.js";
import { deepEqual } from "../helpers/deepEqual.js";

export const packService = {
  async createPack(packData) {
    return await AppDataSource.transaction(
      async (transactionalEntityManager) => {
        const {
          name,
          description,
          discount,
          validFrom,
          validUntil,
          items,
          createdById,
        } = packData;

        const packRepo = transactionalEntityManager.getRepository(Pack);
        const packItemRepo = transactionalEntityManager.getRepository(PackItem);
        const itemStockRepo = transactionalEntityManager.getRepository(ItemStock);
        const movementRepo = transactionalEntityManager.getRepository(InventoryMovement);

        if (!name || !items || items.length === 0) {
          return [null, "Faltan campos obligatorios"];
        }
        if (discount < 0 || discount > 1) {
          return [null, "El descuento debe ser un valor decimal entre 0 y 1"];
        }

        let totalPrice = 0;
        const packItemsDetails = [];
        let totalQuantity = 0;

        for (const itemData of items) {
          const item = await itemStockRepo.findOne({
            where: { id: itemData.itemStockId },
            relations: ["itemType"],
          });

          if (!item) {
            return [
              null,
              `El ítem con ID ${itemData.itemStockId} no existe o está inactivo`,
            ];
          }

          let unitPrice = Number(item.price);

          if (itemData.stampingLevel) {
            const levels = item.itemType.stampingLevels || [];
            const selectedLevel = levels.find(
              (l) => l.level === itemData.stampingLevel
            );

            if (selectedLevel) {
              unitPrice = Number(selectedLevel.price);
            }
          }

          const requestedQty = itemData.quantity;

          if (
            typeof requestedQty !== "number" ||
            !Number.isInteger(requestedQty) ||
            requestedQty <= 0
          ) {
            return [
              null,
              `La cantidad para el ítem '${item.name || item.id}' debe ser un número entero positivo`,
            ];
          }

          if (requestedQty > item.quantity) {
            return [
              null,
              `Stock insuficiente para el ítem '${
                item.itemType?.name || item.id
              }'. Disponible: ${item.quantity}, requerido: ${requestedQty}`,
            ];
          }

        if (isNaN(unitPrice)) {
          return [
            null,
            `El ítem '${item.itemType?.name || item.id}' tiene un precio inválido (${item.price}).`,
          ];
        }

        totalPrice += unitPrice * requestedQty;
        totalQuantity += requestedQty;

          packItemsDetails.push({
            id: item.id,
            name: item.itemType?.name || `Ítem ${item.id}`,
            color: item.hexColor,
            size: item.size || "N/A",
            price: unitPrice,
            stampingLevel: itemData.stampingLevel || "Base",
            quantity: requestedQty,
            snapshot: createItemSnapshot(item),
          });
        }

        const finalPrice = Math.round(totalPrice * (1 - discount));

        const newPack = packRepo.create({
          name,
          description,
          price: finalPrice,
          discount,
          validFrom,
          validUntil,
          createdBy: createdById ? { id: createdById } : null,
        });

        const savedPack = await packRepo.save(newPack);

        for (const itemData of items) {
          await packItemRepo.save(
            packItemRepo.create({
              pack: savedPack,
              itemStock: { id: itemData.itemStockId },
              quantity: itemData.quantity,
            }),
          );
        }

        await movementRepo.save({
          type: "entrada",
          operation: "create_pack",
          reason: `Creación de pack "${name}" con ${items.length} ítems`,
          quantity: totalQuantity,
          pack: savedPack,
          createdBy: { id: createdById },
          changes: {
            pack: {
              name,
              price: finalPrice,
              discount,
            },
            items: packItemsDetails,
          },
          snapshotPackName: name,
          snapshotItemName: `Pack: ${name}`,
          snapshotItemSize: "N/A",
          snapshotPrice: finalPrice,
        });

        return [savedPack, null];
      },
    ).catch((error) => {
      console.error("Error en createPack:", error.message, error.stack);
      return [null, `Error al crear el pack: ${error.message}`];
    });
  },

  async getPacks(filters = {}) {
    try {
      const repo = AppDataSource.getRepository(Pack);
      const where = {};

      if (filters.id) where.id = filters.id;
      if (filters.isActive !== undefined) {
        where.isActive =
          filters.isActive === "false" ? false
            : filters.isActive === "true" ? true
              : filters.isActive;
      }

      const packs = await repo.find({
        where,
        relations: [
          "packItems",
          "packItems.itemStock",
          "packItems.itemStock.itemType",
        ],
        order: { createdAt: "DESC" },
      });

      return [packs, null];
    } catch (error) {
      console.error("Error en getPacks:", error);
      return [null, "Error al obtener los packs"];
    }
  },

  async updatePack(id, updateData) {
    return await AppDataSource.transaction(
      async (transactionalEntityManager) => {
        const repo = transactionalEntityManager.getRepository(Pack);
        const packItemRepo = transactionalEntityManager.getRepository(PackItem);
        const itemStockRepo =
          transactionalEntityManager.getRepository(ItemStock);
        const movementRepo =
          transactionalEntityManager.getRepository(InventoryMovement);

        // 1. Obtener pack con relaciones completas
        const pack = await repo.findOne({
          where: { id },
          relations: [
            "packItems",
            "packItems.itemStock",
            "packItems.itemStock.itemType",
          ],
        });

        if (!pack) return [null, "Pack no encontrado"];
        if (updateData.price !== undefined && updateData.price < 0) {
          return [null, "El precio no puede ser negativo"];
        }

        // 2. Registrar cambios en el pack
        const packChanges = {};
        const updatableFields = [
          "name",
          "description",
          "price",
          "discount",
          "validFrom",
          "validUntil",
          "isActive",
        ];

        for (const field of updatableFields) {
          if (
            updateData[field] !== undefined &&
            !deepEqual(updateData[field], pack[field])
          ) {
            packChanges[field] = {
              oldValue: pack[field],
              newValue: updateData[field],
            };
            pack[field] = updateData[field];
          }
        }

        pack.updatedBy = updateData.updatedById ? { id: updateData.updatedById }
          : null;

        const updatedPack = await repo.save(pack);
        // 3. Procesar cambios en items si se proporcionan
        let itemChanges = null;
        if (Array.isArray(updateData.items)) {
          // Validar nuevos items
          const itemsValidation = await Promise.all(
            updateData.items.map(async (itemData) => {
              const item = await itemStockRepo.findOne({
                where: { id: itemData.itemStockId },
                relations: ["itemType"],
              });

              if (!item) {
                throw new Error(
                  `Ítem con ID ${itemData.itemStockId} no encontrado`,
                );
              }

              if (
                typeof itemData.quantity !== "number" ||
                itemData.quantity <= 0
              ) {
                throw new Error(
                  `Cantidad inválida para ${item.itemType?.name || item.id}`,
                );
              }

              if (itemData.quantity > item.quantity) {
                throw new Error(
                  `Stock insuficiente para ${item.itemType?.name || item.id} ` +
                    `(Disponible: ${item.quantity}, Requerido: ${itemData.quantity})`,
                );
              }

              return {
                item,
                quantity: itemData.quantity,
                itemData,
              };
            }),
          );

          // Preparar comparación de items
          const oldItems = pack.packItems.map((pi) => ({
            id: pi.itemStock.id,
            name: pi.itemStock.itemType?.name || `Ítem ${pi.itemStock.id}`,
            quantity: pi.quantity,
            color: pi.itemStock.hexColor,
            size: pi.itemStock.size,
            price: pi.itemStock.price,
            snapshot: createItemSnapshot(pi.itemStock),
          }));

          const newItems = itemsValidation.map(({ item, quantity }) => ({
            id: item.id,
            name: item.itemType?.name || `Ítem ${item.id}`,
            quantity,
            color: item.hexColor,
            size: item.size,
            price: item.price,
            snapshot: createItemSnapshot(item),
          }));

          itemChanges = { oldItems, newItems };

          // Actualizar relaciones (transaccional)
          await packItemRepo.delete({ pack: { id: pack.id } });

          for (const { itemData } of itemsValidation) {
            await packItemRepo.save(
              packItemRepo.create({
                pack,
                itemStock: { id: itemData.itemStockId },
                quantity: itemData.quantity,
              }),
            );
          }
        }

        // 5. Registrar auditoría consolidada si hay cambios
        if (Object.keys(packChanges).length > 0 || itemChanges) {
          const { operation, reason } = generateInventoryReason("update");

          const movementData = {
            type: "ajuste",
            operation,
            reason: reason || `Actualización de pack "${updatedPack.name}"`,
            quantity: 0,
            pack: updatedPack,
            createdBy: { id: updateData.updatedById },
            changes: {
              pack: packChanges,
              items: itemChanges,
            },
            snapshotPackName: updatedPack.name,
            snapshotItemName: `Pack: ${updatedPack.name}`,
            snapshotItemSize: "N/A",
            snapshotPrice: updatedPack.price,
          };

          await movementRepo.save(movementData);
        }

        return [updatedPack, null];
      },
    ).catch((error) => {
      console.error("Error en updatePack:", error);
      return [null, error.message || "Error al actualizar el pack"];
    });
  },

  async deletePack(id, userId) {
    try {
      const repo = AppDataSource.getRepository(Pack);
      const movementRepo = AppDataSource.getRepository(InventoryMovement);

      const pack = await repo.findOne({
        where: { id },
        relations: ["packItems", "packItems.itemStock"],
      });

      if (!pack) {
        return [null, "Pack no encontrado"];
      }

      pack.isActive = false;
      pack.deletedAt = new Date();

      const updatedPack = await repo.save(pack);

      const { operation, reason } = generateInventoryReason("deactivate");

      // ➖ Registrar salida del inventario por cada ítem del pack
      await movementRepo.save({
        type: "ajuste",
        reason,
        operation,
        quantity: 0,
        pack: updatedPack,
        createdBy: { id: userId },
        snapshotPackName: updatedPack.name,
        snapshotItemName: `Pack: ${updatedPack.name}`,
        snapshotPrice: updatedPack.price || 0,
      });

      return [
        { id: updatedPack.id, message: "Pack desactivado correctamente" },
        null,
      ];
    } catch (error) {
      console.error("Error en deletePack:", error);
      return [null, "Error al desactivar el pack"];
    }
  },

  async restorePack(id, userId) {
    try {
      const repo = AppDataSource.getRepository(Pack);
      const movementRepo = AppDataSource.getRepository(InventoryMovement);

      const pack = await repo.findOne({
        where: { id },
        relations: ["packItems", "packItems.itemStock"],
      });

      if (!pack) {
        return [null, "Pack no encontrado"];
      }

      if (pack.isActive) {
        return [null, "El pack ya está activo"];
      }

      pack.isActive = true;
      pack.deletedAt = null;

      const restoredPack = await repo.save(pack);

      const { operation, reason } = generateInventoryReason("reactivate");

      const totalQty = pack.packItems.reduce(
        (sum, pi) => sum + (pi.quantity || 1),
        0,
      );

      await movementRepo.save({
        type: "ajuste",
        operation,
        reason,
        quantity: totalQty,
        pack: restoredPack,
        createdBy: { id: userId },
        snapshotItemName: `Pack: ${restoredPack.name}`,
        snapshotPackName: restoredPack.name,
        snapshotPrice: restoredPack.price || 0,
      });

      return [restoredPack, null];
    } catch (error) {
      console.error("Error en restorePack:", error);
      return [null, "Error al restaurar el pack"];
    }
  },

  async forceDeletePack(id, userId) {
    try {
      const repo = AppDataSource.getRepository(Pack);
      const movementRepo = AppDataSource.getRepository(InventoryMovement);
      const packItemRepo = AppDataSource.getRepository(PackItem);

      const pack = await repo.findOne({
        where: { id },
        relations: ["packItems", "packItems.itemStock"],
      });

      if (!pack) {
        return [null, "Pack no encontrado"];
      }

      const { operation, reason } = generateInventoryReason("delete");

      const totalQuantity = pack.packItems.reduce(
        (sum, pi) => sum + (pi.quantity || 0),
        0,
      );

      const itemsDetails = pack.packItems.map((pi) => ({
        id: pi.itemStock.id,
        name: pi.itemStock.itemType?.name || `Ítem ${pi.itemStock.id}`,
        quantity: pi.quantity,
        color: pi.itemStock.hexColor,
        size: pi.itemStock.size,
        price: pi.itemStock.price,
        snapshot: createItemSnapshot(pi.itemStock),
      }));

      await movementRepo.save({
        type: "ajuste",
        operation,
        reason,
        quantity: totalQuantity,
        pack: pack,
        createdBy: { id: userId },
        changes: {
          items: itemsDetails,
        },
        snapshotPackName: pack.name,
        snapshotItemName: `Pack: ${pack.name}`,
        snapshotItemSize: "N/A",
        snapshotPrice: pack.price || 0,
      });

      await packItemRepo.delete({ pack: { id: pack.id } });
      await repo.remove(pack);

      return [{ id: pack.id, message: "Pack eliminado permanentemente" }, null];
    } catch (error) {
      console.error("Error en forceDeletePack:", error);
      return [null, "Error al eliminar permanentemente el pack"];
    }
  },

  async emptyTrash(userId) {
    return await AppDataSource.transaction(
      async (transactionalEntityManager) => {
        const repo = transactionalEntityManager.getRepository(Pack);
        const packItemRepo = transactionalEntityManager.getRepository(PackItem);
        const movementRepo =
          transactionalEntityManager.getRepository(InventoryMovement);

        const packsToDelete = await repo.find({
          where: { isActive: false },
          relations: [
            "packItems",
            "packItems.itemStock",
            "packItems.itemStock.itemType",
          ],
        });

        if (!packsToDelete.length) {
          return [0, null];
        }

        const { operation, reason } = generateInventoryReason("purge");

        for (const pack of packsToDelete) {
          const itemsDetails = pack.packItems.map((pi) => ({
            id: pi.itemStock.id,
            name: pi.itemStock.itemType?.name || `Ítem ${pi.itemStock.id}`,
            quantity: pi.quantity,
            color: pi.itemStock.hexColor,
            size: pi.itemStock.size,
            price: pi.itemStock.price,
            snapshot: createItemSnapshot(pi.itemStock),
          }));

          const totalQuantity = pack.packItems.reduce(
            (sum, pi) => sum + (pi.quantity || 0),
            0,
          );

          await movementRepo.save({
            type: "ajuste",
            operation,
            reason,
            quantity: totalQuantity,
            pack: pack,
            createdBy: { id: userId },
            changes: {
              items: itemsDetails,
            },
            snapshotPackName: pack.name,
            snapshotItemName: `Pack: ${pack.name}`,
            snapshotItemSize: "N/A",
            snapshotPrice: pack.price || 0,
          });

          await packItemRepo.delete({ pack: { id: pack.id } });
        }

        await repo.remove(packsToDelete);

        return [packsToDelete.length, null];
      },
    ).catch((error) => {
      console.error("Error en emptyTrash:", error);
      return [null, "Error al vaciar la papelera"];
    });
  },
};
