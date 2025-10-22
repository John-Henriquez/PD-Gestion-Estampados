"use strict";
import { EntitySchema } from "typeorm";

const PackSchema = new EntitySchema({
  name: "Pack",
  tableName: "packs",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    name: {
      type: "varchar",
      length: 100,
      nullable: false,
    },
    description: {
      type: "text",
      nullable: true,
    },
    price: {
      type: "int",
      nullable: false,
    },
    discount: {
      type: "decimal",
      precision: 3,
      scale: 2,
      default: 0.0,
      nullable: false,
    },
    autoCalculatePrice: {
      type: "boolean",
      default: true,
    },
    isActive: {
      type: "boolean",
      default: true,
    },
    validFrom: {
      type: "timestamp",
      nullable: true,
    },
    validUntil: {
      type: "timestamp",
      nullable: true,
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
  },
  relations: {
    packItems: {
      type: "one-to-many",
      target: "PackItem",
      inverseSide: "pack",
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

export default PackSchema;
