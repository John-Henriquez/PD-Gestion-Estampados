"use strict";
import { EntitySchema } from "typeorm";
const OrderItemSchema = new EntitySchema({
  name: "OrderItem",
  tableName: "order_items",
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
    priceAtTime: {
      type: "int",
      nullable: false,
    },
    itemNameSnapshot: {
      type: "varchar",
      nullable: false,
    },
    stampImageUrl: {
      type: "varchar",
      length: 512,
      nullable: true,
    },
    stampInstructions: {
      type: "text",
      nullable: true,
    },
  },
  relations: {
    order: {
      type: "many-to-one",
      target: "Order",
      joinColumn: { name: "order_id" },
      onDelete: "CASCADE",
    },
    itemStock: {
      type: "many-to-one",
      target: "ItemStock",
      joinColumn: { name: "item_stock_id" },
      nullable: true,
      onDelete: "SET NULL",
    },
    pack: {
      type: "many-to-one",
      target: "Pack",
      joinColumn: { name: "pack_id" },
      nullable: true,
      onDelete: "SET NULL",
    },
  },
  indices: [
    { name: "IDX_ORDERITEM_ORDER_ID", columns: ["order"] },
    { name: "IDX_ORDERITEM_ITEMSTOCK_ID", columns: ["itemStock"] },
    { name: "IDX_ORDERITEM_PACK_ID", columns: ["pack"] },
  ],
});

export default OrderItemSchema;
