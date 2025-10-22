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
      enum: ["entrada", "salida", "ajuste", "modificacion"],
      nullable: false,
    },
    operation: {
      type: "varchar",
      length: 50,
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
      default: "Movimiento generado automáticamente",
    },
    changedField: {
      type: "varchar",
      length: 50,
      nullable: true,
      comment: "Campo específico que fue modificado",
    },
    changes: {
      type: "json",
      nullable: true,
      comment: "Detalles del cambio en formato {oldValue, newValue}",
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
      length: 7,
      nullable: true,
    },
    snapshotItemSize: {
      type: "varchar",
      length: 10,
      nullable: true,
    },
    snapshotPrice: {
      type: "decimal",
      precision: 10,
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
      nullable: false,
    },
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
