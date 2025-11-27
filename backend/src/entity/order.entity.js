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

  status: {
    type: "enum",
    enum: [
      "pendiente_de_pago",
      "en_proceso",
      "enviado",
      "completado",        
      "cancelado"
    ],
    default: "pendiente_de_pago",
  },

    subtotal: {
      type: "int",
      nullable: false,
    },
    total: {
      type: "int",
      nullable: false,
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
