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
      default: 1,
    },
  },
  relations: {
    pack: {
      type: "many-to-one",
      target: "Pack",
      joinColumn: { name: "pack_id" },
      nullable: false,
      onDelete: "CASCADE",
    },
    itemStock: {
      type: "many-to-one",
      target: "ItemStock",
      joinColumn: { name: "item_stock_id" },
      nullable: false,
      onDelete: "RESTRICT",
    },
    stampingLevel: {
      type: "many-to-one",
      target: "StampingLevel",
      joinColumn: { name: "stamping_level_id" },
      nullable: true,
      onDelete: "SET NULL",
    },
  },
  indices: [
    { name: "IDX_PACKITEM_PACK",      columns: ["pack"] },
    { name: "IDX_PACKITEM_ITEMSTOCK", columns: ["itemStock"] },
    { name: "CHK_PACKITEM_QUANTITY",  columns: ["quantity"], where: `quantity > 0` },
  ],
});

export default PackItemSchema;
