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
    changes: {
      type: "json",
      nullable: true,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
      default: () => "CURRENT_TIMESTAMP",
    },
    updatedAt: {
      type: "timestamp",
      onUpdate: "CURRENT_TIMESTAMP",
      nullable: true,
    },
    deletedAt: {
      type: "timestamp",
      nullable: true,
    },
    // Campos de snapshot
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
    },
    order: {
      type: "many-to-one",
      target: "Order",
      joinColumn: { name: "order_id" },
      nullable: true,
    }
  },
  indices: [
    {
      name: "IDX_MOVEMENT_CREATED_AT",
      columns: ["createdAt"],
    },
    {
      name: "IDX_MOVEMENT_TYPE",
      columns: ["type"],
    },
  ],
});

export default InventoryMovementSchema;
