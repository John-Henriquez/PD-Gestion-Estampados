"use strict";
import { EntitySchema } from "typeorm";

const InventoryMovementSchema = new EntitySchema({
  name: "InventoryMovement",
  tableName: "inventory_movements",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    type: {
      type: "enum",
      enum: ["entrada", "salida", "ajuste"],
      nullable: false,
    },
    quantity: {
      type: "int",
      nullable: false,
      default: 0,
    },
    reason: {
      type: "text",
      nullable: false,
    },
    changes: { type: "jsonb", nullable: true },
    createdAt: {
      type: "timestamp with time zone",
      createDate: true,
    },
    snapshotItemName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    snapshotItemColor: {
      type: "varchar",
      length: 50,
      nullable: true,
    },
    snapshotItemSize: {
      type: "varchar",
      length: 10,
      nullable: true,
    },
    snapshotPrice: {
      type: "decimal",
      precision: 12,
      scale: 2,
      nullable: true,
      transformer: {
        to: (value) => value,
        from: (value) => parseFloat(value),
      },
    },
    snapshotPackName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
  },
  relations: {
    operation: {
      type: "many-to-one",
      target: "InventoryOperation",
      joinColumn: { name: "operation_id" },
      nullable: false,
      onDelete: "RESTRICT",
    },
    itemStock: {
      type: "many-to-one",
      target: "ItemStock",
      joinColumn: {
        name: "item_stock_id",
        referencedColumnName: "id",
      },
      nullable: true,
      onDelete: "SET NULL",
    },
    pack: {
      type: "many-to-one",
      target: "Pack",
      joinColumn: {
        name: "pack_id",
        referencedColumnName: "id",
      },
      nullable: true,
      onDelete: "SET NULL",
    },
    createdBy: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "created_by",
        referencedColumnName: "id",
      },
      nullable: true,
      onDelete: "SET NULL",
    },
    order: {
      type: "many-to-one",
      target: "Order",
      joinColumn: { name: "order_id" },
      nullable: true,
    }
  },
  indices: [
    { name: "IDX_MOVEMENT_CREATED_AT",   columns: ["createdAt"] },
    { name: "IDX_MOVEMENT_TYPE",          columns: ["type"] },
    { name: "IDX_MOVEMENT_ITEM_STOCK",    columns: ["itemStock"] },
    { name: "IDX_MOVEMENT_OPERATION",     columns: ["operation"] },
    { name: "IDX_MOVEMENT_ORDER",         columns: ["order"] },
    { name: "CHK_MOVEMENT_QUANTITY",      columns: ["quantity"],
      where: `quantity != 0` }, 
  ],
});

export default InventoryMovementSchema;
