import { AppDataSource } from "../config/configDb.js";
import ItemType from "../entity/itemType.entity.js";
import ItemStock from "../entity/itemStock.entity.js";
import InventoryMovement from "../entity/InventoryMovementSchema.js";
import InventoryOperation from "../entity/inventoryOperation.entity.js";
import Pack from "../entity/pack.entity.js";
import PackItem from "../entity/packItem.entity.js";
import { deepEqual } from "../helpers/deepEqual.js";
import { createItemSnapshot, generateInventoryReason } from "../helpers/inventory.helpers.js";
import { Not } from "typeorm";

const getOpEntity = async (manager, slug) => {
  const meta = generateInventoryReason(slug);
  const operation = await manager.getRepository(InventoryOperation).findOneBy({ slug: meta.operation });
  if (!operation) throw new Error(`Operación '${meta.operation}' no inicializada en la base de datos.`);
  return { operation, meta };
};

export const itemStockService = {
  async createItemStock(itemData, userId) {
    return await AppDataSource.transaction(async (transactionalEntityManager) => {
      const itemStockRepo = transactionalEntityManager.getRepository(ItemStock);
      const itemTypeRepo = transactionalEntityManager.getRepository(ItemType);
      const movementRepo = transactionalEntityManager.getRepository(InventoryMovement);

      const itemsToProcess = Array.isArray(itemData) ? itemData : [itemData];
      const savedItems = [];
      const { operation, meta } = await getOpEntity(transactionalEntityManager, "initial_load");

      for (const data of itemsToProcess) {
        const { itemTypeId, colorId, size, quantity, minStock } = data;

        const itemType = await itemTypeRepo.findOne({ where: { id: itemTypeId, isActive: true } });
        if (!itemType) {
          throw new Error(`Tipo de artículo ID ${itemTypeId} no encontrado o inactivo`);
        }

        const normalizedSize = itemType.hasSizes ? size : null;
        const existing = await itemStockRepo.findOne({
          where: { 
            itemType: { id: itemTypeId }, 
            color: { id: colorId }, 
            size: normalizedSize || null 
          }
        });

        if (existing) {
          throw new Error(`Ya existe stock para ${itemType.name} en ese color/talla.`);
        }

        const newItem = itemStockRepo.create({
          color: { id: colorId },
          size: normalizedSize,
          quantity: quantity || 0,
          minStock: minStock || 10,
          itemType,
          createdBy: { id: userId },
        });

        const savedItem = await itemStockRepo.save(newItem);

        const fullItem = await itemStockRepo.findOne({
          where: { id: savedItem.id },
          relations: ["itemType", "color"]
        });

        await movementRepo.save({
          type: meta.type,
          operation,
          reason: itemsToProcess.length > 1 ? `${meta.reason} (Carga Masiva)` : `${meta.reason} (Individual)`,
          quantity: savedItem.quantity,
          itemStock: savedItem,
          createdBy: { id: userId },
          ...createItemSnapshot(fullItem),
        });

        savedItems.push(fullItem);
      }

      return [Array.isArray(itemData) ? savedItems : savedItems[0], null];
    }).catch(err => {
      console.error("Error en createItemStock:", err.message);
      return [null, err.message];
    });
  },

  async getItemStock(filters = {}) {
    try {
      const qb = AppDataSource.getRepository(ItemStock).createQueryBuilder(
        "itemStock",
      );
      qb.leftJoinAndSelect("itemStock.itemType", "itemType")
        .leftJoinAndSelect("itemType.stampingLevels", "stampingLevels")
        .leftJoinAndSelect("itemStock.color", "color");

      const parsedFilters = {
        ...filters,
        isActive:
          filters.isActive === "false" ? false
            : filters.isActive === "true" ? true
              : filters.isActive,
      };

      if (parsedFilters.id) {
        qb.andWhere("itemStock.id = :id", { id: parsedFilters.id });
      }

      if (parsedFilters.itemTypeId) {
        qb.andWhere("itemType.id = :itemTypeId", {
          itemTypeId: parsedFilters.itemTypeId,
        });
      }

      if (parsedFilters.colorId) {
        qb.andWhere("color.id = :colorId", { colorId: parsedFilters.colorId });
      }

      if (parsedFilters.size !== undefined) {
        if (parsedFilters.size === "N/A") {
          qb.andWhere("itemStock.size IS NULL");
        } else {
          qb.andWhere("itemStock.size = :size", { size: parsedFilters.size });
        }
      }

      if (parsedFilters.publicOnly === true) {
        qb.andWhere("itemStock.isActive = :isActive", { isActive: true });
        qb.andWhere("itemStock.quantity > 0");

        qb.andWhere((sub) => {
        const subQuery = sub.subQuery()
          .select("1")
          .from("item_type_stamping_levels", "itsl")
          .where("itsl.item_type_id = itemType.id")
          .getQuery();
        return `EXISTS (${subQuery})`;
      });
    } else {
        const isActiveStatus = parsedFilters.isActive !== undefined ? parsedFilters.isActive : true;
        qb.andWhere("itemStock.isActive = :isActive", {
          isActive: isActiveStatus,
        });
      }

      const items = await qb
        .orderBy("itemType.name", "ASC")
        .addOrderBy("color.name", "ASC") 
        .getMany();

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

      const qb = AppDataSource.getRepository(ItemStock).createQueryBuilder(
        "itemStock",
      );
      
      qb.leftJoinAndSelect("itemStock.itemType", "itemType")
      .leftJoinAndSelect("itemType.stampingLevels", "stampingLevels")
      .leftJoinAndSelect("itemStock.color", "color")
      .where("itemStock.id = :id", { id })
      .andWhere("itemStock.isActive = true")
      .andWhere((sub) => {
        const subQuery = sub.subQuery()
          .select("1")
          .from("item_type_stamping_levels", "itsl")
          .where("itsl.item_type_id = itemType.id")
          .getQuery();
        return `EXISTS (${subQuery})`;
      });

      const item = await qb.getOne();

      if (!item) {
        return [null, "Producto no encontrado o no disponible."];
      }

      return [item, null];
    } catch (error) {
      console.error(
        `Error detallado en getPublicItemStockById (ID: ${id}):`,
        error,
      );
      return [null, "Error al obtener los detalles del producto."];
    }
  },

  async updateItemStock(id, updateData, userId) {
    return await AppDataSource.transaction(async (transactionalEntityManager) => {
      const repo = transactionalEntityManager.getRepository(ItemStock);
      const movementRepo = transactionalEntityManager.getRepository(InventoryMovement);

      const item = await repo.findOne({ 
        where: { id }, 
        relations: ["itemType", "color"] 
      });

      if (!item) return [null, "Item no encontrado"];

      const changes = {};
      const trackableFields = ["quantity", "minStock", "isActive", "size"];

      trackableFields.forEach((field) => {
        if (updateData[field] !== undefined && !deepEqual(updateData[field], item[field])) {
          changes[field] = { oldValue: item[field], newValue: updateData[field] };
          item[field] = updateData[field];
        }
      });

      if (Object.keys(changes).length === 0) return [item, "No se detectaron cambios"];

      const updatedItem = await repo.save(item);

      for (const field of Object.keys(changes)) {
        let slug = "update_info";
        if (field === "quantity") slug = changes.quantity.newValue > changes.quantity.oldValue ? "adjust_in" : "adjust_out";
        if (field === "minStock") slug = "min_stock_change";

        const { operation, meta } = await getOpEntity(transactionalEntityManager, slug);

        await movementRepo.save({
          type: meta.type,
          operation,
          quantity: field === "quantity" ? Math.abs(changes.quantity.newValue - changes.quantity.oldValue) : 0,
          itemStock: updatedItem,
          createdBy: { id: userId },
          reason: meta.reason,
          changes: { [field]: changes[field] },
          ...createItemSnapshot(updatedItem)
        });
      }

      return [updatedItem, null];
    });
  },

  async deleteItemStock(id, userId) {
    return await AppDataSource.transaction(async (transactionalEntityManager) => {
      const repo = transactionalEntityManager.getRepository(ItemStock);
      const movementRepo = transactionalEntityManager.getRepository(InventoryMovement);
      const packItemRepo = transactionalEntityManager.getRepository(PackItem);

     const item = await repo.findOne({ where: { id }, relations: ["itemType", "color"] });
      if (!item || !item.isActive) return [null, { errorCode: 404, message: "Item no encontrado o ya inactivo" }];

      const isUsed = await packItemRepo.count({ where: { itemStock: { id: item.id } } });
      if (isUsed > 0) return [null, { errorCode: 409, message: "Item en uso en paquetes" }];

      item.isActive = false;
      item.deletedAt = new Date();
      await repo.save(item);

      const { operation, meta } = await getOpEntity(transactionalEntityManager, "deactivate");

      await movementRepo.save({
        type: meta.type,
        quantity: 0,
        itemStock: item,
        createdBy: { id: userId },
        operation,
        reason: meta.reason,
        ...createItemSnapshot(item),
      });

      return [{ id: item.id }, null];
    });
  },

  async restoreItemStock(id, userId) {
    return await AppDataSource.transaction(async (transactionalEntityManager) => {
      const repo = transactionalEntityManager.getRepository(ItemStock);
      const movementRepo = transactionalEntityManager.getRepository(InventoryMovement);

      const item = await repo.findOne({ where: { id }, relations: ["itemType", "color"] });
      if (!item || item.isActive) return [null, "El item ya está activo"];
      if (!item.itemType?.isActive) return [null, "El tipo de ítem padre está desactivado"];

      item.isActive = true;
      item.deletedAt = null;
      await repo.save(item);

      const { operation, meta } = await getOpEntity(transactionalEntityManager, "reactivate");

      await movementRepo.save({
        type: meta.type,
        operation,
        quantity: 0,
        itemStock: item,
        createdBy: { id: userId },
        reason: meta.reason,
        ...createItemSnapshot(item),
      });

      return [item, null];
    });
  },

  async forceDeleteItemStock(id, userId) {
    return await AppDataSource.transaction(async (transactionalEntityManager) => {
      const repo = transactionalEntityManager.getRepository(ItemStock);
      const movementRepo = transactionalEntityManager.getRepository(InventoryMovement);
      const packItemRepo = transactionalEntityManager.getRepository(PackItem);

      const item = await repo.findOne({ where: { id }, relations: ["itemType", "color"] });
      if (!item) return [null, "Item no encontrado"];

      const isUsed = await packItemRepo.count({ where: { itemStock: { id } } });
      if (isUsed > 0) return [null, "Item en uso en paquetes"];

      const { operation, meta } = await getOpEntity(transactionalEntityManager, "purge");

      await movementRepo.save({
        type: meta.type,
        operation,
        quantity: 0,
        itemStock: null,
        createdBy: { id: userId },
        reason: meta.reason,
        ...createItemSnapshot(item),
      });

      await repo.remove(item);
      return [{ id, message: "Eliminado permanentemente" }, null];
    });
  },

  async emptyTrash(userId) {
    return await AppDataSource.transaction(async (transactionalEntityManager) => {
      const repo = transactionalEntityManager.getRepository(ItemStock);
      const packItemRepo = transactionalEntityManager.getRepository(PackItem);
      const movementRepo = transactionalEntityManager.getRepository(InventoryMovement);
      
      const itemsToDelete = await repo.find({
        where: { isActive: false },
        relations: ["itemType", "color"],
      });

      if (itemsToDelete.length === 0) return [0, null];

      const { operation: opEntity, meta } = await getOpEntity(transactionalEntityManager, "purge");

      let deletedCount = 0;
      const notDeleted = [];

      for (const item of itemsToDelete) {
        const isUsed = await packItemRepo.count({
          where: { itemStock: { id: item.id } },
        });

        if (isUsed > 0) {
          notDeleted.push({
            id: item.id,
            name: item.itemType?.name || "Ítem desconocido",
          });
          continue;
        }

        await movementRepo.save({
          type: meta.type, 
          operation: opEntity, 
          quantity: 0,
          itemStock: null, 
          createdBy: { id: userId },
          reason: meta.reason,
          ...createItemSnapshot(item), 
        });

        await repo.remove(item);
        deletedCount++;
      }
      if (notDeleted.length > 0) {
        const message = `Se eliminaron ${deletedCount} ítems. Los siguientes no se borraron por estar en uso en packs:\n${notDeleted
          .map((i) => `• ${i.name} (ID: ${i.id})`)
          .join("\n")}`;
        return [deletedCount, message];
      }

      return [deletedCount, null];
    }).catch((error) => {
      console.error("Error en transacción emptyTrash:", error);
      return [null, "Error al vaciar la papelera: " + error.message];
    });
  },

  async adjustStock(itemId, amount, userId, manualReason = "") {
      return await AppDataSource.transaction(async (transactionalEntityManager) => {
        const stockRepo = transactionalEntityManager.getRepository(ItemStock);
        const movementRepo = transactionalEntityManager.getRepository(InventoryMovement);

        const item = await stockRepo.findOne({ where: { id: itemId }, relations: ["itemType", "color"] });
        if (!item || !item.isActive) return [null, "Item no encontrado o inactivo"];

        const slug = amount > 0 ? "adjust_in" : "adjust_out";
        const { operation, meta } = await getOpEntity(transactionalEntityManager, slug);

        const oldQty = item.quantity;
        item.quantity += amount;
        if (item.quantity < 0) throw new Error("El stock resultante no puede ser negativo");
        
        await stockRepo.save(item);

        await movementRepo.save({
          type: meta.type,
          operation,
          quantity: Math.abs(amount),
          reason: manualReason || meta.reason,
          itemStock: item,
          createdBy: { id: userId },
          changes: { quantity: { oldValue: oldQty, newValue: item.quantity } },
          ...createItemSnapshot(item),
        });

        return [item, null];
      });
  },

  async restockVariants(restockData, userId) {
    return await AppDataSource.transaction(async (transactionalEntityManager) => {
      const repo = transactionalEntityManager.getRepository(ItemStock);
      const movementRepo = transactionalEntityManager.getRepository(InventoryMovement);
      
      const { operation, meta } = await getOpEntity(transactionalEntityManager, "restock");
      
      const updatedStocks = [];

      for (const item of restockData) {
        const { id, addedQuantity } = item;
        
        if (!addedQuantity || addedQuantity <= 0) continue;

        const stock = await repo.findOne({ 
          where: { id, isActive: true },
          relations: ["itemType", "color"] 
        });

        if (!stock) throw new Error(`Stock con ID ${id} no encontrado.`);

        const oldQty = stock.quantity;
        stock.quantity += parseInt(addedQuantity);
        const savedStock = await repo.save(stock);

        await movementRepo.save({
          type: meta.type,
          operation,
          quantity: parseInt(addedQuantity),
          reason: meta.name || "Recarga de Stock",
          itemStock: savedStock,
          createdBy: { id: userId },
          changes: {
            cantidad: { oldValue: oldQty, newValue: savedStock.quantity }
          },
          ...createItemSnapshot(savedStock)
        });

        updatedStocks.push(savedStock);
      }

      return [updatedStocks, null];
    }).catch(err => {
      console.error("Error en restockVariants:", err);
      return [null, err.message];
    });
  }
};
