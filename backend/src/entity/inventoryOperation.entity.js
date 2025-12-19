"use strict";
import { EntitySchema } from "typeorm";

const InventoryOperationSchema = new EntitySchema({
  name: "InventoryOperation",
  tableName: "inventory_operations",
  columns: {
    id: { type: "int", primary: true, generated: true },
    slug: { type: "varchar", length: 50, unique: true },
    name: { type: "varchar", length: 100 },
    type: { type: "enum", enum: ["entrada", "salida", "ajuste"] },
    description: { type: "text", nullable: true }
  },
});

export default InventoryOperationSchema;