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
});

export default ColorSchema;