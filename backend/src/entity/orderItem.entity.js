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
      length: 255,
      nullable: false,
    },
    sizeSnapshot: {
      type: "varchar",
      length: 10,
      nullable: true, 
    },
    colorHexSnapshot: {
      type: "varchar",
      length: 7,
      nullable: true, 
    },
    colorNameSnapshot: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    stampOptionsSnapshot: {
      type: "json",
      nullable: true,
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
    { name: "IDX_ORDERITEM_ORDER_ID", columns: ["order_id"] },
    { name: "IDX_ORDERITEM_ITEMSTOCK_ID", columns: ["item_stock_id"] },
    { name: "IDX_ORDERITEM_PACK_ID", columns: ["pack_id"] },
    { name: "CHK_ORDERITEM_QUANTITY", columns: ["quantity"],
      where: `quantity > 0` },           
    { name: "CHK_ORDERITEM_PRICE", columns: ["priceAtTime"],
      where: `"priceAtTime" >= 0` },
  ],
});

export default OrderItemSchema;
