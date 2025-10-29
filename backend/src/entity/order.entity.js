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

    paymentStatus: {
      type: "varchar",
      length: 50,
      default: "pendiente_anticipo",
      nullable: false,
      comment:
        "Estado del pago (pendiente_anticipo, anticipo_pagado, pagado_completo, reembolsado)",
    },
    subtotal: {
      type: "int",
      nullable: false,
    },
    total: {
      type: "int",
      nullable: false,
    },
    advancePaymentRequired: {
      type: "int",
      nullable: true,
      comment: "Monto del anticipo requerido para iniciar el procesamiento",
    },
    amountPaid: {
      type: "int",
      default: 0,
      nullable: false,
      comment: "Monto total pagado hasta el momento",
    },
    paymentMethod: {
      type: "varchar",
      length: 100,
      nullable: true,
      comment: "Método de pago utilizado (ej: Transferencia, MercadoPago)",
    },
    paymentDate: {
      type: "timestamp",
      nullable: true,
      comment: "Fecha del último pago registrado",
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
  indices: [
    { name: "IDX_ORDER_STATUS", columns: ["status"] },
    { name: "IDX_ORDER_PAYMENT_STATUS", columns: ["paymentStatus"] },
    { name: "IDX_ORDER_USER_ID", columns: ["user"] }, // Indexar la relación de usuario
  ],
});

export default OrderSchema;
