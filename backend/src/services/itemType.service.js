import { AppDataSource } from "../config/configDb.js";
import ItemType from "../entity/itemType.entity.js";
import ItemStock from "../entity/itemStock.entity.js";
import InventoryMovement from "../entity/InventoryMovementSchema.js";
import { generateInventoryReason } from "../helpers/inventory.helpers.js";
import { Not } from "typeorm";

export const itemTypeService = {
  async createItemType(itemTypeData, userId) {
    try {
      const repo = AppDataSource.getRepository(ItemType);

      const existingType = await repo.findOne({
        where: { name: itemTypeData.name },
      });

      let parsedStampOptions = null;
      if (itemTypeData.stampOptions) {
        try {
          parsedStampOptions =
            typeof itemTypeData.stampOptions === "string"
              ? JSON.parse(itemTypeData.stampOptions)
              : itemTypeData.stampOptions;

          if (
            typeof parsedStampOptions !== "object" ||
            parsedStampOptions === null
          ) {
            throw new Error("stampOptions debe ser un objeto JSON.");
          }
          if (
            parsedStampOptions.locations &&
            !Array.isArray(parsedStampOptions.locations)
          ) {
            throw new Error(
              "stampOptions.locations debe ser un array de strings (ej: ['front', 'back']).",
            );
          }
          if (
            parsedStampOptions.types &&
            !Array.isArray(parsedStampOptions.types)
          ) {
            throw new Error(
              "stampOptions.types debe ser un array de strings (ej: ['dtf', 'vinyl']).",
            );
          }
        } catch (e) {
          return [
            null,
            {
              type: "VALIDATION_ERROR",
              message: e.message || "Error procesando stamp options.",
              field: "stampOptions",
            },
          ];
        }
      }

      const newItemType = repo.create({
        name: itemTypeData.name,
        description: itemTypeData.description,
        category: itemTypeData.category,
        hasSizes: itemTypeData.hasSizes,
        printingMethods: itemTypeData.printingMethods || [],
        sizesAvailable: itemTypeData.hasSizes
          ? Array.isArray(itemTypeData.sizesAvailable)
            ? itemTypeData.sizesAvailable
            : []
          : [],
        iconName: itemTypeData.iconName || null,
        stampOptions: parsedStampOptions,
        baseImageUrl: itemTypeData.baseImageUrl || null,
        createdBy: { id: userId },
      });

      const savedItemType = await repo.save(newItemType);
      return [savedItemType, null];
    } catch (error) {
      console.error("Error en createItemType [itemTypeService]:", error);
      return [
        null,
        {
          type: "INTERNAL_ERROR",
          message: "Error inesperado al crear el tipo de ítem",
          details: error.message,
        },
      ];
    }
  },

  async getItemTypes() {
    try {
      const repo = AppDataSource.getRepository(ItemType);
      const itemTypes = await repo.find({
        where: { isActive: true },
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
    try {
      const repo = AppDataSource.getRepository(ItemType);
      const itemType = await repo.findOne({
        where: { id: parseInt(id) },
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

      let parsedStampOptions = itemType.stampOptions;
      if (itemTypeData.stampOptions !== undefined) {
        if (itemTypeData.stampOptions === null) {
          parsedStampOptions = null;
        } else {
          try {
            parsedStampOptions =
              typeof itemTypeData.stampOptions === "string"
                ? JSON.parse(itemTypeData.stampOptions)
                : itemTypeData.stampOptions;

            if (
              typeof parsedStampOptions !== "object" ||
              parsedStampOptions === null
            ) {
              throw new Error("stampOptions debe ser un objeto JSON.");
            }
            if (
              parsedStampOptions.locations &&
              !Array.isArray(parsedStampOptions.locations)
            ) {
              throw new Error(
                "stampOptions.locations debe ser un array de strings.",
              );
            }
            if (
              parsedStampOptions.types &&
              !Array.isArray(parsedStampOptions.types)
            ) {
              throw new Error(
                "stampOptions.types debe ser un array de strings.",
              );
            }
          } catch (e) {
            return [
              null,
              {
                type: "VALIDATION_ERROR",
                message: e.message || "Error procesando stampOptions.",
                field: "stampOptions",
              },
            ];
          }
        }
      }
      let sizes = itemType.sizesAvailable;
      const newHasSizes =
        itemTypeData.hasSizes !== undefined
          ? itemTypeData.hasSizes
          : itemType.hasSizes;

      if (newHasSizes === true && itemTypeData.sizesAvailable !== undefined) {
        sizes = Array.isArray(itemTypeData.sizesAvailable)
          ? itemTypeData.sizesAvailable
          : [];
      } else if (newHasSizes === false) {
        sizes = [];
      }

      let newBaseImageUrl = itemType.baseImageUrl; 
      if (itemTypeData.baseImageUrl !== undefined) {
         newBaseImageUrl = itemTypeData.baseImageUrl;
      }

      repo.merge(itemType, {
        name: itemTypeData.name,
        description: itemTypeData.description,
        hasSizes: newHasSizes,
        printingMethods: itemTypeData.printingMethods,
        sizesAvailable: sizes,
        iconName: itemTypeData.iconName,
        stampOptions: parsedStampOptions,
        baseImageUrl: newBaseImageUrl,
        updatedBy: { id: userId },
      });

      const updatedItemType = await repo.save(itemType);
      return [updatedItemType, null];
    } catch (error) {
      console.error("Error en updateItemType [itemTypeService]:", error);
      return [
        null,
        {
          type: "INTERNAL_ERROR",
          message: "Error inesperado al actualizar el tipo de ítem",
          details: error.message,
        },
      ];
    }
  },

  async deleteItemType(id, userId) {
    try {
      const itemTypeRepo = AppDataSource.getRepository(ItemType);
      const itemStockRepo = AppDataSource.getRepository(ItemStock);

      const itemType = await itemTypeRepo.findOne({
        where: { id: parseInt(id), isActive: true },
        relations: ["stocks"],
      });

      if (!itemType) {
        return [
          null,
          {
            type: "NOT_FOUND",
            message: "Tipo de ítem no encontrado o ya está desactivado",
            id,
          },
        ];
      }

      const hasActiveStocks = itemType.stocks.some((stock) => stock.isActive);
      if (hasActiveStocks) {
        return [
          null,
          {
            type: "CONFLICT",
            message:
              "No se puede desactivar el tipo de ítem porque tiene stock activo asociado",
            id,
          },
        ];
      }

      itemType.isActive = false;
      await itemTypeRepo.save(itemType);

      return [{ id: parseInt(id), affectedStocks: 0 }, null];
    } catch (error) {
      console.error("Error en deleteItemType [itemTypeService]:", error);
      return [
        null,
        {
          type: "INTERNAL_ERROR",
          message: "Error inesperado al desactivar el tipo de ítem",
          details: error.message,
        },
      ];
    }
  },

  async restoreItemType(id, userId) {
    try {
      const itemTypeRepo = AppDataSource.getRepository(ItemType);
      const itemStockRepo = AppDataSource.getRepository(ItemStock);

      const itemType = await itemTypeRepo.findOne({
        where: { id: parseInt(id), isActive: false },
        relations: ["stocks"],
      });

      if (!itemType) {
        return [
          null,
          {
            type: "NOT_FOUND",
            message: "Tipo de ítem no encontrado o ya está activo",
            id,
          },
        ];
      }

      itemType.isActive = true;
      await itemTypeRepo.save(itemType);

      const stocksToRestore = itemType.stocks.filter(
        (s) => s.deactivatedByItemType,
      );

      for (const stock of stocksToRestore) {
        stock.isActive = true;
        stock.deletedAt = null;
        stock.deactivatedByItemType = false;
      }

      if (stocksToRestore.length > 0) {
        await itemStockRepo.save(stocksToRestore);
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
    try {
      const parsedId = parseInt(id);
      const itemTypeRepo = AppDataSource.getRepository(ItemType);
      const itemStockRepo = AppDataSource.getRepository(ItemStock);
      const movementRepo = AppDataSource.getRepository(InventoryMovement);

      const itemType = await itemTypeRepo.findOne({
        where: { id: parseInt(id) },
        relations: ["stocks"],
      });

      if (!itemType) {
        return [
          null,
          {
            type: "NOT_FOUND",
            message: "Tipo de ítem no encontrado",
            field: "id",
          },
        ];
      }

      await Promise.all(
        itemType.stocks.map((stock) =>
          movementRepo.save({
            type: "ajuste",
            quantity: 0,
            itemStock: stock,
            createdBy: { id: userId },
            reason: generateInventoryReason("purge"),
            itemName: itemType.name,
            itemColor: stock.hexColor,
            itemSize: stock.size,
            itemTypeName: itemType.name,
          }),
        ),
      );

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

      for (const itemType of deletedItems) {
        await Promise.all(
          itemType.stocks.map((stock) =>
            movementRepo.save({
              type: "ajuste",
              quantity: 0,
              itemStock: stock,
              createdBy: { id: userId },
              reason: generateInventoryReason("purge"),
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
};
