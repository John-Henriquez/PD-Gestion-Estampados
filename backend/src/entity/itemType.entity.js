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
    iconName: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    stampOptions: {
        type: "json", 
        nullable: true,
        comment: "Define las opciones de estampado posibles para este tipo, ej: " + 
          "{ locations: ['front', 'back'], types: ['dtf', 'vinyl'] }"
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
  },
  relations: {
    stocks: {
      type: "one-to-many",
      target: "ItemStock",
      inverseSide: "itemType",
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

export default ItemTypeSchema;
