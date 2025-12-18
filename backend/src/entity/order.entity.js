"use strict";
import { EntitySchema } from "typeorm";

const OrderSchema = new EntitySchema({
  name: "Order",
  tableName: "orders",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    subtotal: {
      type: "decimal",
      precision: 12,
      scale: 2,
      transformer: { to: (v) => v, from: (v) => parseFloat(v) },
    },
    total: {
      type: "decimal",
      precision: 12,
      scale: 2,
      transformer: { to: (v) => v, from: (v) => parseFloat(v) },
    },
    paymentMethod: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    paymentDate: {
      type: "timestamp",
      nullable: true,
    },
    customerName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    guestEmail: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    customerPhone: { 
      type: "varchar",
      length: 20,
      nullable: true
    },
    shippingAddress: {
      type: "text",
      nullable: true
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
    status: {
      type: "many-to-one",
      target: "OrderStatus",
      joinColumn: { name: "status_id" },
      nullable: false,
  },
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "user_id" },
      nullable: true,
    },
    orderItems: {
      type: "one-to-many",
      target: "OrderItem",
      inverseSide: "order",
      cascade: true,
    },
  },
  indices: [
    { name: "IDX_ORDER_STATUS", columns: ["status"] },
    { name: "IDX_ORDER_USER_ID", columns: ["user"] },
    { name: "IDX_ORDER_GUEST_EMAIL", columns: ["guestEmail"] },
  ],
});

export default OrderSchema;
