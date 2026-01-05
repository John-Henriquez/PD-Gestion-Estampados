import { AppDataSource } from "../config/configDb.js";
import ItemType from "../entity/itemType.entity.js";
import ItemStock from "../entity/itemStock.entity.js";
import StampingLevel from "../entity/stampingLevel.entity.js";
import InventoryMovement from "../entity/InventoryMovementSchema.js";
import InventoryOperation from "../entity/inventoryOperation.entity.js";
import { generateInventoryReason, createItemSnapshot } from "../helpers/inventory.helpers.js";
import { Not } from "typeorm";

const processStampingLevels = async (levelsData, manager) => {
  if (!levelsData || !Array.isArray(levelsData)) return [];
  
  const stampingLevelRepo = manager.getRepository(StampingLevel);
  const resultLevels = [];

  for (const data of levelsData) {
    let level = await stampingLevelRepo.findOneBy({ level: data.level.trim() });

    if (!level) {
      level = stampingLevelRepo.create({
        level: data.level.trim(),
        price: Math.round(parseFloat(data.price)),
        description: data.description || ""
      });
      level = await stampingLevelRepo.save(level);
    } else {
      level.price = parseFloat(data.price);
      level.description = data.description || level.description;
      await stampingLevelRepo.save(level);
    }
    resultLevels.push(level);
  }
  return resultLevels;
};

export const itemTypeService = {
  async createItemType(itemTypeData, userId) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repo = queryRunner.manager.getRepository(ItemType);
      const stockRepo = queryRunner.manager.getRepository(ItemStock);
      const movementRepo = queryRunner.manager.getRepository(InventoryMovement);
      const operationRepo = queryRunner.manager.getRepository(InventoryOperation);

      // 1. Validar duplicado
      const existingType = await repo.findOne({ where: { name: itemTypeData.name } });
      if (existingType) {
        await queryRunner.rollbackTransaction();
        return [null, { type: "CONFLICT_ERROR", message: `El nombre '${itemTypeData.name}' ya existe.`, field: "name" }];
      }

      // 2. Validar niveles de estampado
      let rawLevels = itemTypeData.stampingLevels;
      if (typeof rawLevels === "string") rawLevels = JSON.parse(rawLevels);
      const linkedLevels = await processStampingLevels(rawLevels, queryRunner.manager);

      // 3. Crear nuevo tipo de ítem
      const newItemType = repo.create({
        name: itemTypeData.name,
        description: itemTypeData.description,
        category: itemTypeData.category,
        hasSizes: itemTypeData.hasSizes,
        printingMethods: itemTypeData.printingMethods,
        sizesAvailable: itemTypeData.sizesAvailable,
        productImageUrls: itemTypeData.productImageUrls,
        stampingLevels: linkedLevels,
        createdBy: { id: userId },
      });
      const savedItemType = await repo.save(newItemType);

      // 4. Crear stock inicial
      let initialStock = itemTypeData.initialStock;
      if (typeof initialStock === "string") initialStock = JSON.parse(initialStock);

      if (Array.isArray(initialStock) && initialStock.length > 0){
        const meta = generateInventoryReason("initial_load");
        const operationEntity = await operationRepo.findOneBy({ slug: meta.operation });

        if (!operationEntity) {
          console.warn(`Operación '${meta.operation}' no encontrada en DB. Usando ajuste genérico.`);
        }

        for (const stockVar of initialStock) {
          const newStock = stockRepo.create({
            itemType: savedItemType,
            color: { id: stockVar.colorId },
            size: savedItemType.hasSizes ? stockVar.size : null,
            quantity: parseInt(stockVar.quantity) || 0,
            minStock: parseInt(stockVar.minStock) || 5,
            createdBy: { id: userId }
          });

          const savedStock = await stockRepo.save(newStock);
          
          const fullStockForSnapshot = await queryRunner.manager.findOne(ItemStock, { 
            where: { id: savedStock.id }, 
            relations: ["itemType", "color"] 
          });

          const snapshot = createItemSnapshot(fullStockForSnapshot);

          await movementRepo.save({
            type: "entrada",
            operation: operationEntity,
            reason: `${meta.reason} (Carga inicial: ${savedItemType.name})`,
            quantity: savedStock.quantity,
            itemStock: savedStock,
            createdBy: { id: userId },
            ...snapshot
          });
        }
      }

      await queryRunner.commitTransaction();
      return [savedItemType, null];

    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error("Error en createItemType (Bulk):", error);
      return [null, { type: "INTERNAL_ERROR", message: error.message }];
    } finally {
      await queryRunner.release();
    }
  },

  async getItemTypes() {
    try {
      const repo = AppDataSource.getRepository(ItemType);
      const itemTypes = await repo.find({
        where: { isActive: true },
        relations: ["stampingLevels"],
        order: { name: "ASC" },
      });

      return [itemTypes, null];
    } catch (error) {
      console.error("Error en getItemTypes [itemTypeService]:", error);
      return [
        null,
        {
          type: "INTERNAL_ERROR",
          message: "Error inesperado al obtener los tipos de ítem",
          details: error.message,
        },
      ];
    }
  },

  async getItemTypeById(id) {
    try {
      const repo = AppDataSource.getRepository(ItemType);
      const itemType = await repo.findOne({
        where: {
          id: parseInt(id),
          isActive: true,
        },
        relations: ["stampingLevels"],
      });

      if (!itemType) {
        return [
          null,
          {
            type: "NOT_FOUND",
            message: "Tipo de ítem no encontrado o no está activo",
            id,
          },
        ];
      }

      return [itemType, null];
    } catch (error) {
      console.error("Error en getItemTypeById [itemTypeService]:", error);
      return [
        null,
        {
          type: "INTERNAL_ERROR",
          message: "Error inesperado al obtener el tipo de ítem",
          details: error.message,
        },
      ];
    }
  },

  async updateItemType(id, itemTypeData, userId) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      const repo = queryRunner.manager.getRepository(ItemType);

      const itemType = await repo.findOne({ 
        where: { id: Number(id) },
        relations: ["stampingLevels"] 
      });

      if (!itemType) {
        return [null, { type: "NOT_FOUND", message: "Tipo de ítem no encontrado", id }];
      }
      if (itemTypeData.name && itemTypeData.name !== itemType.name) {
      const existingItemType = await repo.findOne({
        where: { 
          name: itemTypeData.name,
          id: Not(Number(id)) 
        },
      });
        if (existingItemType) {
          await queryRunner.rollbackTransaction();
          return [null, {
            type: "DUPLICATE_NAME",
            message: "Ya existe un tipo de ítem con ese nombre",
            field: "name",
          }];
        }
      }

      if (itemTypeData.stampingLevels !== undefined) {
        let rawLevels = itemTypeData.stampingLevels;
        if (typeof rawLevels === "string") rawLevels = JSON.parse(rawLevels);
        itemType.stampingLevels = await processStampingLevels(rawLevels, queryRunner.manager);
      }

    const newHasSizes = itemTypeData.hasSizes !== undefined 
      ? (String(itemTypeData.hasSizes) === "true") 
      : itemType.hasSizes;

    let sizes = itemType.sizesAvailable;
    if (newHasSizes) {
      if (itemTypeData.sizesAvailable !== undefined) {
        sizes = Array.isArray(itemTypeData.sizesAvailable) ? itemTypeData.sizesAvailable : [];
      }
    } else {
      sizes = [];
    }

    let newProductImageUrls = itemType.productImageUrls; 
    if (itemTypeData.productImageUrls !== undefined) {
       newProductImageUrls = Array.isArray(itemTypeData.productImageUrls) ? itemTypeData.productImageUrls
         : [];
    }

    const updateObject = {
      name: itemTypeData.name ?? itemType.name, 
      description: itemTypeData.description ?? itemType.description,
      hasSizes: newHasSizes,
      sizesAvailable: sizes,
      printingMethods: itemTypeData.printingMethods ?? itemType.printingMethods,
      productImageUrls: itemTypeData.productImageUrls ?? itemType.productImageUrls,
      updatedBy: { id: userId },
    };

    repo.merge(itemType, updateObject);
    const updatedItemType = await repo.save(itemType);

    await queryRunner.commitTransaction();
    return [updatedItemType, null];

    } catch (error) {
      console.error("Error en updateItemType [itemTypeService]:", error);
      return [null, {
        type: "INTERNAL_ERROR",
        message: "Error inesperado al actualizar el tipo de ítem",
        details: error.message,
      }];
    } finally {
      await queryRunner.release();
    }
  },

  async deleteItemType(id, userId) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const itemTypeRepo = queryRunner.manager.getRepository(ItemType);
      const stockRepo = queryRunner.manager.getRepository(ItemStock);
      const movementRepo = queryRunner.manager.getRepository(InventoryMovement);
      const operationRepo = queryRunner.manager.getRepository(InventoryOperation);

      const itemType = await itemTypeRepo.findOne({
        where: { id: parseInt(id), isActive: true },
        relations: ["stocks", "stocks.color"],
      });

      if (!itemType) {
        await queryRunner.rollbackTransaction();
        return [null, { type: "NOT_FOUND", message: "Tipo de ítem no encontrado" }];
      }

      const meta = generateInventoryReason("type_deactivation");
      const operationEntity = await operationRepo.findOneBy({ slug: meta.operation });

      for (const stock of itemType.stocks) {
        if (stock.isActive) {
          stock.isActive = false;
          stock.deactivatedByItemType = true;
          await stockRepo.save(stock);

          await movementRepo.save({
            type: meta.type,
            operation: operationEntity,
            quantity: 0,
            reason: meta.reason,
            itemStock: stock,
            createdBy: { id: userId },
            ...createItemSnapshot({ ...stock, itemType })
          });
        }
      }


      itemType.isActive = false;
      await itemTypeRepo.save(itemType);

      await queryRunner.commitTransaction();
      return [{ id: parseInt(id) }, null];
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return [null, { type: "INTERNAL_ERROR", message: error.message }];
    } finally {
      await queryRunner.release();
    }
  },

  async restoreItemType(id, userId) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const itemTypeRepo = queryRunner.manager.getRepository(ItemType);
      const stockRepo = queryRunner.manager.getRepository(ItemStock);
      const movementRepo = queryRunner.manager.getRepository(InventoryMovement);
      const operationRepo = queryRunner.manager.getRepository(InventoryOperation);

      const itemType = await itemTypeRepo.findOne({
        where: { id: parseInt(id), isActive: false },
        relations: ["stocks", "stocks.color"],
      });

      if (!itemType) {
        await queryRunner.rollbackTransaction();
        return [null, { type: "NOT_FOUND", message: "Tipo no encontrado" }];
      }

      const meta = generateInventoryReason("reactivate");
      const operationEntity = await operationRepo.findOneBy({ slug: meta.operation });

      itemType.isActive = true;
      await itemTypeRepo.save(itemType);

      const stocksToRestore = itemType.stocks.filter(s => s.deactivatedByItemType);
      for (const stock of stocksToRestore) {
        stock.isActive = true;
        stock.deactivatedByItemType = false;
        await stockRepo.save(stock);

        await movementRepo.save({
          type: meta.type,
          operation: operationEntity,
          quantity: 0,
          reason: meta.reason,
          itemStock: stock,
          createdBy: { id: userId },
          ...createItemSnapshot({ ...stock, itemType })
        });
      }

      return [
        {
          restoredItemTypeId: id,
          restoredStocks: stocksToRestore.length,
        },
        null,
      ];
    } catch (error) {
      console.error("Error en restoreItemType:", error);
      return [
        null,
        {
          type: "INTERNAL_ERROR",
          message: "Error inesperado al restaurar el tipo de ítem",
          details: error.message,
        },
      ];
    }
  },

  async getDeletedItemTypes() {
    try {
      const repo = AppDataSource.getRepository(ItemType);
      const itemTypes = await repo.find({
        where: { isActive: false },
        order: { name: "ASC" },
      });
      return [itemTypes, null];
    } catch (error) {
      console.error("Error en getDeletedItemTypes [itemTypeService]:", error);
      return [
        null,
        {
          type: "INTERNAL_ERROR",
          message: "Error inesperado al obtener ítems eliminados",
          details: error.message,
        },
      ];
    }
  },

  async forceDeleteItemType(id, userId) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const itemTypeRepo = queryRunner.manager.getRepository(ItemType);
      const itemStockRepo = queryRunner.manager.getRepository(ItemStock);
      const movementRepo = queryRunner.manager.getRepository(InventoryMovement);

      const itemType = await itemTypeRepo.findOne({
        where: { id: parseInt(id) },
        relations: ["stocks", "stocks.color"],
      });

      if (!itemType) {
        await queryRunner.rollbackTransaction();
        return [null, { type: "NOT_FOUND", message: "No encontrado" }];
      }

      const meta = generateInventoryReason("purge");
      const operationEntity = await operationRepo.findOneBy({ slug: meta.operation });

      const movementPromises = itemType.stocks.map((stock) =>
        movementRepo.save({
          type: meta.type,
          operation: operationEntity,
          quantity: 0, 
          itemStock: null,
          createdBy: { id: userId },
          reason: meta.reason, 
          ...createItemSnapshot({ ...stock, itemType })
        })
      );
      await Promise.all(movementPromises);

      if (itemType.stocks.length > 0) {
        await itemStockRepo.remove(itemType.stocks);
      }

      await itemTypeRepo.remove(itemType);

      return [
        { id: parseInt(id), deletedStocks: itemType.stocks.length },
        null,
      ];
    } catch (error) {
      console.error("Error en forceDeleteItemType:", error);
      return [
        null,
        {
          type: "INTERNAL_ERROR",
          message: "Error al eliminar permanentemente el tipo de ítem",
          details: error.message,
        },
      ];
    }
  },

  async emptyTrash(userId) {
    try {
      const repo = AppDataSource.getRepository(ItemType);
      const itemStockRepo = AppDataSource.getRepository(ItemStock);
      const movementRepo = AppDataSource.getRepository(InventoryMovement);

      const deletedItems = await repo.find({
        where: { isActive: false },
        relations: ["stocks"],
      });

      if (deletedItems.length === 0) {
        return [[], null];
      }

      const { reason, operation } = generateInventoryReason("purge");
      const operationEntity = await operationRepo.findOneBy({ slug: meta.operation });

      for (const itemType of deletedItems) {
        await Promise.all(
          itemType.stocks.map((stock) =>
            movementRepo.save({
              type: "ajuste",
              quantity: 0,
              itemStock: null,
              createdBy: { id: userId },
              reason: meta.reason,
              operation: operationEntity,
              itemName: itemType.name,
              itemColor: stock.hexColor,
              itemSize: stock.size,
              itemTypeName: itemType.name,
            }),
          ),
        );
      }
      const allStocks = deletedItems.flatMap((itemType) => itemType.stocks);
      if (allStocks.length > 0) {
        await itemStockRepo.remove(allStocks);
      }

      await repo.remove(deletedItems);
      return [deletedItems.map((item) => ({ id: item.id })), null];
    } catch (error) {
      console.error("Error en emptyTrash:", error);
      return [
        null,
        {
          type: "INTERNAL_ERROR",
          message: "Error al vaciar la papelera",
          details: error.message,
        },
      ];
    }
  },

  async getStampingLevels() {
    try {
      const repo = AppDataSource.getRepository(StampingLevel);
      const levels = await repo.find({
        where: { isActive: true },
        order: { level: "ASC" }
      });
      return [levels, null];
    } catch (error) {
      console.error("Error en getStampingLevels:", error);
      return [null, { type: "INTERNAL_ERROR", message: error.message }];
    }
  },
};
