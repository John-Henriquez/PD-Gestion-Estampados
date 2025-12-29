import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Comuna",
  tableName: "comunas",
  columns: {
    id: { primary: true, type: "int", generated: true },
    name: { type: "varchar", length: 100 },
    baseShippingPrice: { type: "int", default: 0 },
    hasDelivery: { type: "boolean", default: true },
    zone: { type: "varchar", length: 50, nullable: true },
  },
  relations: {
    region: {
      type: "many-to-one",
      target: "Region",
      joinColumn: { name: "region_id" },
      inverseSide: "comunas",
    },
  },
});