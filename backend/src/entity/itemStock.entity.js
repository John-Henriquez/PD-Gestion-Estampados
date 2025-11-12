"use strict";
import { EntitySchema } from "typeorm";

const ItemStockSchema = new EntitySchema({
  name: "ItemStock",
  tableName: "item_stocks",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    hexColor: {
      type: "varchar",
      length: 7,
      nullable: false,
    },
    size: {
      type: "varchar",
      length: 10,
      nullable: true,
    },
    quantity: {
      type: "int",
      default: 0,
      nullable: false,
    },
    minStock: {
      type: "int",
      default: 5,
    },
    isActive: {
      type: "boolean",
      default: true,
    },
    createdAt: {
      type: "timestamp with time zone",
      createDate: true,
    },
    updatedAt: {
      type: "timestamp with time zone",
      updateDate: true,
    },
    deletedAt: {
      type: "timestamp with time zone",
      nullable: true,
    },
    deactivatedByItemType: {
      type: "boolean",
      default: false,
    },
  },
  relations: {
    itemType: {
      type: "many-to-one",
      target: "ItemType",
      joinColumn: { name: "itemTypeId" },
      nullable: false,
      onDelete: "RESTRICT", 
    },
    createdBy: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "created_by" },
      nullable: true,
      onDelete: "SET NULL",
    },
    updatedBy: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "updated_by" },
      nullable: true,
    },
  },
});

export default ItemStockSchema;
