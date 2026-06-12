"use strict";
import { EntitySchema } from "typeorm";

const InventoryOperationSchema = new EntitySchema({
  name: "InventoryOperation",
  tableName: "inventory_operations",
  columns: {
    id: { type: "int", primary: true, generated: true },
    slug: { type: "varchar", length: 50, unique: true, nullable: false },
    name: { type: "varchar", length: 100, nullable: false },
    type: { type: "enum", enum: ["entrada", "salida", "ajuste"], nullable: false },
    description: { type: "text", nullable: true },
    createdAt: { type: "timestamp with time zone", createDate: true },
  },
  indices: [
    { name: "IDX_INVENTORY_OP_TYPE", columns: ["type"] },
  ],
});

export default InventoryOperationSchema;