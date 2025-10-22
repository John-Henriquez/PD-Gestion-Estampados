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
    price: {
      type: "int",
      nullable: false,
    },
    images: {
      type: "jsonb",
      nullable: true,
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
      type: "timestamp",
      createDate: true,
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true,
    },
    deletedAt: {
      type: "timestamp",
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
      joinColumn: { name: "item_type_id" },
      nullable: false,
    },
    createdBy: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "created_by" },
      nullable: true,
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
