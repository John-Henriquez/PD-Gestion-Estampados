"use strict";
import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Comuna",
  tableName: "comunas",
  columns: {
    id: { primary: true, type: "int", generated: true },
    name: { type: "varchar", length: 100, nullable: false },
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
      nullable: false,
      onDelete: "RESTRICT",
    },
  },
  indices: [
    { name: "IDX_COMUNA_REGION",   columns: ["region_id"] },
    { name: "IDX_COMUNA_ZONE",     columns: ["zone"] },
    { name: "CHK_COMUNA_SHIPPING", columns: ["baseShippingPrice"],
      where: `"baseShippingPrice" >= 0` },
    { name: "CHK_COMUNA_ZONE",     columns: ["zone"],
      where: `zone IN ('LOCAL','SUR_CERCANO','CENTRO','NORTE','SUR','NORTE_EXTREMO','SUR_EXTREMO') OR zone IS NULL` },
  ],
});