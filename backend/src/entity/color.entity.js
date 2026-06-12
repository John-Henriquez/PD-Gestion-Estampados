"use strict";
import { EntitySchema } from "typeorm";

const ColorSchema = new EntitySchema({
  name: "Color",
  tableName: "colors",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    name: {
      type: "varchar",
      length: 50,
      unique: true,
      nullable: false,
    },
    hex: {
      type: "varchar",
      length: 7,
      unique: true,
      nullable: false,
    },
  },
  indices: [
    { name: "CHK_COLOR_HEX", columns: ["hex"],
      where: `hex ~ '^#[0-9A-Fa-f]{6}$'` },
  ],
});

export default ColorSchema;