"use strict";
import { EntitySchema } from "typeorm";

const OrderStatusSchema = new EntitySchema({
  name: "OrderStatus",
  tableName: "order_statuses",
  columns: {
    id: { type: "int", primary: true, generated: true },
    name: { type: "varchar", length: 50, unique: true, nullable: false }, 
    displayName: { type: "varchar", length: 100, nullable: false }, 
  },
  indices: [
    { name: "CHK_ORDER_STATUS_NAME", columns: ["name"],
      where: `name IN ('pendiente_de_pago', 'en_proceso', 'enviado', 'completado', 'cancelado')` },
  ],
});

export default OrderStatusSchema;