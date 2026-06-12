"use strict";
import { EntitySchema } from "typeorm";

const StampingLevelSchema = new EntitySchema({
  name: "StampingLevel",
  tableName: "stamping_levels",
  columns: {
    id: { type: "int", primary: true, generated: true },
    level: { 
      type: "varchar", 
      length: 100, 
      unique: true,
      nullable: false 
    },
    description: { type: "text", nullable: true },
    price: { type: "int", nullable: false },
    isActive: { type: "boolean", default: true },
    createdAt: { type: "timestamp with time zone", createDate: true },
    updatedAt: { type: "timestamp with time zone", updateDate: true },
  },
  indices: [
    { name: "IDX_STAMPING_LEVEL_ACTIVE", columns: ["isActive"] },
    { name: "CHK_STAMPING_LEVEL_PRICE",  columns: ["price"],
      where: `price >= 0` },
  ],
});

export default StampingLevelSchema;