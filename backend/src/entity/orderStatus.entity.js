import { EntitySchema } from "typeorm";

const OrderStatusSchema = new EntitySchema({
  name: "OrderStatus",
  tableName: "order_statuses",
  columns: {
    id: { type: "int", primary: true, generated: true },
    name: { type: "varchar", length: 50, unique: true, nullable: false }, 
    displayName: { type: "varchar", length: 100, nullable: false }, 
  },
});

export default OrderStatusSchema;