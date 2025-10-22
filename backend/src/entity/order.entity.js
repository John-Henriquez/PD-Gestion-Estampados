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
        "pendiente",
        "pagado",
        "enviado",
        "completado",
        "cancelado",
        "fallido",
      ],
      default: "pendiente",
    },
    subtotal: {
      type: "int",
      nullable: false,
    },
    total: {
      type: "int",
      nullable: false,
    },
    customerName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    customerEmail: {
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
});

export default OrderSchema;
