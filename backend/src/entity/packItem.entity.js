"use strict";
import { EntitySchema } from "typeorm";

const PackItemSchema = new EntitySchema({
  name: "PackItem",
  tableName: "pack_items",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    quantity: {
      type: "int",
      nullable: false,
    },
    stampingLevel: {
      type: "varchar",
      length: 50,
      nullable: true,
    },
  },
  relations: {
    pack: {
      type: "many-to-one",
      target: "Pack",
      joinColumn: { name: "pack_id" },
      nullable: false,
    },
    itemStock: {
      type: "many-to-one",
      target: "ItemStock",
      joinColumn: { name: "item_stock_id" },
      nullable: false,
    },
  },
});

export default PackItemSchema;
