"use strict";
import { EntitySchema } from "typeorm";

const ItemTypeSchema = new EntitySchema({
  name: "ItemType",
  tableName: "item_types",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    name: {
      type: "varchar",
      length: 100,
      unique: true,
      nullable: false,
    },
    description: {
      type: "text",
      nullable: true,
    },
    category: {
      type: "enum",
      enum: ["clothing", "object"],
      nullable: false,
    },
    printingMethods: {
      type: "simple-array",
      nullable: true,
    },
    sizesAvailable: {
      type: "simple-array",
      nullable: true,
    },
    hasSizes: {
      type: "boolean",
      default: false,
      nullable: false,
    },
    productImageUrls: {
      type: "jsonb",    
      nullable: true,
      default: [],
    },
    isActive: {
      type: "boolean",
      default: true,
    },
    createdAt: { type: "timestamp with time zone", createDate: true },
    updatedAt: { type: "timestamp with time zone", updateDate: true },
  },
  relations: {
    stampingLevels: {
      type: "many-to-many",
      target: "StampingLevel",
      joinTable: {
        name: "item_type_stamping_levels",
        joinColumn: { name: "item_type_id" },
        inverseJoinColumn: { name: "stamping_level_id" }
      },
      cascade: true,
    },
    stocks: {
      type: "one-to-many",
      target: "ItemStock",
      inverseSide: "itemType",
    },
    createdBy: {
      type: "many-to-one", target: "User",
      joinColumn: { name: "created_by" },
      nullable: true,
      onDelete: "SET NULL",
    },
    updatedBy: {
      type: "many-to-one", target: "User",
      joinColumn: { name: "updated_by" },
      nullable: true,
      onDelete: "SET NULL",
    },
  },
  indices: [
    { name: "IDX_ITEM_TYPE_NAME",     columns: ["name"], unique: true },
    { name: "IDX_ITEM_TYPE_CATEGORY", columns: ["category"] },
    { name: "IDX_ITEM_TYPE_ACTIVE",   columns: ["isActive"] },
  ],
});

export default ItemTypeSchema;
