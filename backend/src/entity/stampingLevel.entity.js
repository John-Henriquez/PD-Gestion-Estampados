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
  },
});

export default StampingLevelSchema;