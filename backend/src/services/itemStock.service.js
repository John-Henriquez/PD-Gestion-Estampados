import { AppDataSource } from "../config/configDb.js";
import ItemType from "../entity/itemType.entity.js";
import ItemStock from "../entity/itemStock.entity.js";
import InventoryMovement from "../entity/InventoryMovementSchema.js";
import Pack from "../entity/pack.entity.js";
import PackItem from "../entity/packItem.entity.js";
import { deepEqual } from "../helpers/deepEqual.js";
import {
  createItemSnapshot,
  generateInventoryReason,
} from "../helpers/inventory.helpers.js";
import { MoreThan, Not } from "typeorm";

export const itemStockService = {
  async createItemStock(itemData, userId) {
    return await AppDataSource.transaction(
      async (transactionalEntityManager) => {
        const {
          itemTypeId,
          hexColor,
          size,
          quantity,
          price,
          stampOptionsPricing,
          productImageUrls,
          minStock,
        } = itemData;
        const itemStockRepo =
          transactionalEntityManager.getRepository(ItemStock);
        const itemTypeRepo = 
          transactionalEntityManager.getRepository(ItemType);
        const movementRepo =
          transactionalEntityManager.getRepository(InventoryMovement);

        if (!itemTypeId || !hexColor || quantity == null || price == null) {
          return [null, "Faltan campos obligatorios"];
        }
        if (quantity < 0 || price < 0) {
          return [null, "La cantidad y el precio deben ser no negativos"];
        }
        if (stampOptionsPricing && typeof stampOptionsPricing !== "object") {
            return [null, "stampOptionsPricing debe ser un objeto JSON válido"];
        }

        const itemType = await itemTypeRepo.findOne({
          where: { id: itemTypeId, isActive: true },
        });

        if (!itemType) {
          return [null, "Tipo de artículo no encontrado o inactivo"];
        }
        if (itemType.category !== "clothing" && stampOptionsPricing) {
            console.warn(
              "Se intentó asignar stampOptionsPricing a un ItemStock de categoría '" +
              itemType.category +
              "', se ignorará."
            );
            return [null, `No se permite stampOptionsPricing para la categoría '${itemType.category}'`];
            itemData.stampOptionsPricing = null; 
        }

        if (itemType.hasSizes && !size) {
          return [null, "Este tipo de artículo requiere especificar talla"];
        }

        const existing = await itemStockRepo.findOne({
          where: {
            itemType: { id: itemTypeId },
            hexColor,
            size: itemType.hasSizes ? size : null,
          },
          relations: ["itemType"],
        });

        if (existing) {
          return [null, "Ya existe un stock con ese nombre y color"];
        }

        const MIN_STOCK_DEFAULTS = {
          clothing: 10,
          default: 20,
        };
        const minStockValue =
          minStock ||
          MIN_STOCK_DEFAULTS[itemType.category] ||
          MIN_STOCK_DEFAULTS.default;

        const newItem = itemStockRepo.create({
          hexColor,
          size: itemType.hasSizes ? size : null,
          quantity,
          price,
          productImageUrls: Array.isArray(productImageUrls) ? productImageUrls : [],
          minStock: minStockValue,
          itemType,
          createdBy: { id: userId },
        });

        const savedItem = await itemStockRepo.save(newItem);

        const { operation, reason } = generateInventoryReason("create");
        await movementRepo.save({
          type: "entrada",
          operation,
          reason,
          quantity: newItem.quantity,
          itemStock: savedItem,
          createdBy: { id: userId },
          ...createItemSnapshot(savedItem),
        });

        return [savedItem, null];
      },
    ).catch((error) => {
      console.error("Error en createItemStock:", error.message, error.stack);
      return [null, `Error al crear el item en inventario: ${error.message}`];
    });
  },

  async getItemStock(filters = {}) {
    try {
      const repo = AppDataSource.getRepository(ItemStock);
      const where = {};
      const parsedFilters = {
        ...filters,
        isActive:
          filters.isActive === "false" ? false
            : filters.isActive === "true" ? true
            : filters.isActive,
      };
      if (parsedFilters.id) where.id = parsedFilters.id;
      if (parsedFilters.itemTypeId) where.itemType = { id: parsedFilters.itemTypeId };
      if (parsedFilters.size !== undefined) {
        where.size = parsedFilters.size === "N/A" ? null : parsedFilters.size;
      }

      if(parsedFilters.publicOnly === true){
        where.isActive = true;
        where.quantity = MoreThan(0);
      } else if (parsedFilters !== undefined){
        where.isActive = parsedFilters.isActive;
      }
      
      const items = await repo.find({
        where,
        relations: ["itemType"],
        order: { itemType: { name: "ASC" } },
      });

      return [items, null];
    } catch (error) {
      console.error("Error detallado en getItemStock:", error);
      return [null, "Error al obtener el inventario"];
    }
  },

  async getPublicItemStockById(id) {
    try {
      if (isNaN(id) || id <= 0) {
        return [null, "ID de item inválido."];
      }

      const repo = AppDataSource.getRepository(ItemStock);
      const item = await repo.findOne({
        where: {
          id: id,
          isActive: true
        },
        relations: ["itemType"], 
      });

      if (!item) {
        return [null, "Producto no encontrado o no disponible."];
      }

      return [item, null]; 
    } catch (error) {
      console.error(`Error detallado en getPublicItemStockById (ID: ${id}):`, error);
      return [null, "Error al obtener los detalles del producto."];
    }
  },

  async updateItemStock(id, updateData, userId) {
    return await AppDataSource.transaction(
      async (transactionalEntityManager) => {
        const repo = AppDataSource.getRepository(ItemStock);
        const movementRepo = AppDataSource.getRepository(InventoryMovement);

        const item = await repo.findOne({
          where: { id },
          relations: ["itemType"],
        });

        if (!item) {
          return [null, "Item no encontrado"];
        }

        const { updatedById } = updateData;

        if (updateData.quantity !== undefined && !userId) {
        return [
          null,
          "El ID del usuario que actualiza es obligatorio para cambios de cantidad",
        ];
      }
      if (updateData.quantity !== undefined && updateData.quantity < 0) {
        return [null, "La cantidad no puede ser negativa"];
      }
      if (updateData.price !== undefined && updateData.price < 0) {
        return [null, "El precio no puede ser negativo"];
      }
      if (
          updateData.stampOptionsPricing !== undefined &&
          typeof updateData.stampOptionsPricing !== "object" &&
          updateData.stampOptionsPricing !== null 
        ) {
          throw new Error("stampOptionsPricing debe ser un objeto JSON válido o null");
        }
      if (
        updateData.size !== undefined &&
        item.itemType.hasSizes &&
        !updateData.size
      ) {
        return [null, "Este tipo de artículo requiere especificar talla"];
      }

      if (
        (updateData.hexColor && updateData.hexColor !== item.hexColor) ||
        (updateData.itemTypeId && updateData.itemTypeId !== item.itemType.id)
      ) {
        const duplicateCheckConditions = {
              id: Not(id),
              itemType: { id: updateData.itemTypeId || item.itemType.id }, 
              hexColor: updateData.hexColor || item.hexColor,
              size: item.itemType.hasSizes ? (updateData.size !== undefined ? updateData.size : item.size) : null,
        };

        const duplicate = await repo.findOne({
              where: duplicateCheckConditions,
              relations: ["itemType"],
            });

        if (duplicate) {
          throw new Error(
            "Ya existe otro stock con tipo " + duplicate.itemType.name +
            ", color " + duplicateCheckConditions.hexColor +
            " y talla " + (duplicateCheckConditions.size ?? "N/A")
          );
        }
      }

      // 1. Preparar cambios
      const changes = {};
      const trackableFields = [
        "hexColor",
        "size",
        "quantity",
        "price",
        "stampOptionsPricing",
        "productImageUrls",
        "minStock",
        "isActive",
      ];

      trackableFields.forEach((field) => {
        let updateValue = updateData[field];

        if (field === "productImageUrls" && updateValue !== undefined && !Array.isArray(updateValue)) {
            console.warn("productImageUrls recibido no era un array, se convertirá a array vacío.");
            updateValue = []; 
        }

        if (field === "stampOptionsPricing" && item.itemType.category !== "clothing" && updateValue) {
              console.warn(
                "Se intentó asignar stampOptionsPricing a un ItemStock de categoría '" +
                item.itemType.category +
                "', se ignorará la actualización de este campo."
              );
              updateValue = undefined; 
          }

        if ( updateValue !== undefined && !deepEqual(updateValue, item[field]) ) {
          changes[field] = {
            oldValue: item[field],
            newValue: updateValue,
          };
        }
      });

      if (Object.keys(changes).length === 0) {
        console.log(`No se detectaron cambios para el item ID ${id}`);
        return [item, "No se detectaron cambios"];
      }

      // 2. Aplicar cambios
      trackableFields.forEach((field) => {
        if (changes[field]) {
          // Asegurar que productImageUrls se guarde como array
           if (field === "productImageUrls" && !Array.isArray(updateData[field])) {
               item[field] = [];
           } else {
               item[field] = updateData[field];
           }
        }
      });

      item.updatedAt = new Date();

      const updatedItem = await repo.save(item);

      // 3. Registrar movimientos
      const movementPromises = Object.keys(changes).map(async (field) => {

        if (field !== "productImageUrls") {
          const { operation, reason } = generateInventoryReason("update", field);
          const movementData = {
            type: "ajuste",
            quantity:
              field === "quantity" ? Math.abs(changes.quantity.newValue - changes.quantity.oldValue)
                : 0,
            itemStock: item,
            createdBy: { id: userId },
            operation,
            reason,
            changedField: field,
            changes: {
              [field]: {
                oldValue: changes[field].oldValue,
                newValue: changes[field].newValue,
              },
            },
            ...createItemSnapshot(updatedItem),
          };
          return movementRepo.save(movementData);
        }
        return Promise.resolve();
      });

      await Promise.all(movementPromises);

      return [updatedItem, null];
    }).catch((error) => {
      console.error("Error en transacción updateItemStock:", error);
      return [null, error.message || "Error interno al actualizar el stock"];
    });
  },

  async deleteItemStock(id, userId) {
    try {
      const repo = AppDataSource.getRepository(ItemStock);
      const packItemRepo = AppDataSource.getRepository(PackItem);
      const movementRepo = AppDataSource.getRepository(InventoryMovement);

      const item = await repo.findOne({
        where: { id },
        relations: ["itemType"],
      });

      if (!item) {
        return [
          null,
          { errorCode: 404, message: "Item de inventario no encontrado" },
        ];
      }

      if (!item.isActive) {
        return [
          null,
          { errorCode: 409, message: "El item ya está desactivado" },
        ];
      }

      const isUsed = await packItemRepo.count({
        where: { itemStock: { id: item.id } },
      });
      if (isUsed > 0) {
        return [
          null,
          {
            errorCode: 409,
            message:
              "No se puede desactivar este item porque está siendo utilizado en uno o más paquetes",
          },
        ];
      }

      item.isActive = false;
      item.deletedAt = new Date();

      const updated = await repo.save(item);

      const { operation, reason } = generateInventoryReason("deactivate");

      await movementRepo.save({
        type: "ajuste",
        quantity: 0,
        itemStock: item,
        createdBy: { id: userId },
        operation,
        reason,
        ...createItemSnapshot(item),
      });

      return [
        { id: updated.id, message: "Item desactivado correctamente" },
        null,
      ];
    } catch (error) {
      console.error("Error en deleteItemStock:", error);
      return [
        null,
        {
          errorCode: 500,
          message: "Error interno al desactivar el item de inventario",
        },
      ];
    }
  },

  async restoreItemStock(id, userId) {
    try {
      if (!userId) {
        return [null, "Se requiere el ID del usuario que realiza la acción"];
      }

      const repo = AppDataSource.getRepository(ItemStock);
      const movementRepo = AppDataSource.getRepository(InventoryMovement);
      const item = await repo.findOne({
        where: { id },
        relations: ["itemType"],
      });

      if (!item) {
        return [null, "Item de inventario no encontrado"];
      }
      if (item.isActive) {
        return [null, "El item ya está activo"];
      }

      if (!item.itemType?.isActive) {
        return [
          null,
          "No se puede restaurar un stock cuyo tipo de ítem está desactivado",
        ];
      }

      item.isActive = true;
      item.deletedAt = null;

      const restoredItem = await repo.save(item);

      const { operation, reason } = generateInventoryReason("reactivate");

      await movementRepo.save({
        type: "ajuste",
        quantity: 0,
        itemStock: restoredItem,
        createdBy: { id: userId },
        operation,
        reason,
        ...createItemSnapshot(restoredItem),
      });

      return [restoredItem, null];
    } catch (error) {
      console.error("Error en restoreItemStock:", error);
      return [null, "Error al restaurar el item"];
    }
  },

  async forceDeleteItemStock(id, userId) {
    try {
      const repo = AppDataSource.getRepository(ItemStock);
      const packRepo = AppDataSource.getRepository(Pack);
      const packItemRepo = AppDataSource.getRepository(PackItem);
      const movementRepo = AppDataSource.getRepository(InventoryMovement);
      const item = await repo.findOne({
        where: { id },
        relations: ["itemType"],
      });

      if (!item) {
        return [null, "Item de inventario no encontrado"];
      }

      const isUsed = await packItemRepo.count({ where: { itemStock: { id } } });

      if (isUsed > 0) {
        return [
          null,
          "No se puede eliminar este item porque está siendo utilizado en uno o más paquetes",
        ];
      }

      const { operation, reason } = generateInventoryReason("delete");

      await movementRepo.save({
        type: "ajuste",
        quantity: 0,
        itemStock: item,
        createdBy: { id: userId },
        operation,
        reason,
        ...createItemSnapshot(item),
      });

      await repo.remove(item);

      return [{ id: item.id, message: "Item eliminado permanentemente" }, null];
    } catch (error) {
      console.error("Error en forceDeleteItemStock:", error);
      return [null, "Error al eliminar permanentemente el item"];
    }
  },

  async emptyTrash(userId) {
    try {
      const repo = AppDataSource.getRepository(ItemStock);
      const packItemRepo = AppDataSource.getRepository(PackItem);
      const movementRepo = AppDataSource.getRepository(InventoryMovement);

      const itemsToDelete = await repo.find({
        where: { isActive: false },
        relations: ["itemType"],
      });

      if (itemsToDelete.length === 0) {
        return [0, null];
      }

      const { operation, reason } = generateInventoryReason("purge");

      let deletedCount = 0;
      const notDeleted = [];

      for (const item of itemsToDelete) {
        const isUsed = await packItemRepo.count({
          where: { itemStock: { id: item.id } },
        });

        if (isUsed > 0) {
          notDeleted.push({
            id: item.id,
            name: item.itemType?.name || "",
            reason: "Usado en uno o más paquetes",
          });
          continue;
        }

        await movementRepo.save({
          type: "ajuste",
          quantity: 0,
          itemStock: item,
          createdBy: { id: userId },
          operation,
          reason,
          ...createItemSnapshot(item),
        });

        await repo.remove(item);
        deletedCount++;
      }

      if (notDeleted.length > 0) {
        const message = `Algunos items no se eliminaron porque están en uso:\n${notDeleted
          .map((i) => `• ${i.name} (ID: ${i.id})`)
          .join("\n")}`;
        return [deletedCount, message];
      }

      return [deletedCount, null];
    } catch (error) {
      console.error("Error en emptyTrash:", error);
      return [null, "Error al vaciar la papelera"];
    }
  },

  async adjustStock(itemId, amount, userId, manualReason = "") {
    return await AppDataSource.transaction(
      async (transactionalEntityManager) => {
        const stockRepo = transactionalEntityManager.getRepository(ItemStock);
        const movementRepo =
          transactionalEntityManager.getRepository(InventoryMovement);

        const item = await stockRepo.findOne({
          where: { id: itemId },
          relations: ["itemType"],
        });

        if (!item) {
          return [null, "Item no encontrado"];
        }

        if (!item.isActive) {
          return [null, "No se puede ajustar un item desactivado"];
        }

        const newQuantity = item.quantity + amount;

        if (newQuantity < 0) {
          return [null, "No se puede dejar el stock en negativo"];
        }

        const originalQuantity = item.quantity;
        item.quantity = newQuantity;

        const updatedItem = await stockRepo.save(item);

        const isEntry = amount > 0;

        const { operation, reason } = generateInventoryReason(
          "adjust",
          isEntry ? "in" : "out",
        );
        const movementReason = manualReason || reason;

        await movementRepo.save({
          type: "ajuste",
          quantity: Math.abs(amount),
          operation,
          reason: movementReason,
          itemStock: item,
          createdBy: { id: userId },
          changes: {
            quantity: {
              oldValue: originalQuantity,
              newValue: newQuantity,
            },
          },
          ...createItemSnapshot(item),
        });

        return [updatedItem, null];
      },
    ).catch((err) => {
      console.error("Error en adjustStock:", err);
      return [null, "Error al ajustar el stock"];
    });
  },
};
