import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Region",
  tableName: "regions",
  columns: {
    id: { primary: true, type: "int", generated: true },
    name: { type: "varchar", length: 100, unique: true },
    ordinal: { type: "varchar", length: 10, nullable: true },
  },
  relations: {
    comunas: {
      type: "one-to-many",
      target: "Comuna",
      inverseSide: "region",
    },
  },
});