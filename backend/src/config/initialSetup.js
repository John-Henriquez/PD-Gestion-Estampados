"use strict";
import User from "../entity/user.entity.js";
import Color from "../entity/color.entity.js";
import Region from "../entity/region.entity.js";
import Comuna from "../entity/comuna.entity.js";
import InventoryOperation from "../entity/inventoryOperation.entity.js";
import OrderStatus from "../entity/orderStatus.entity.js";
import { AppDataSource } from "./configDb.js";
import { encryptPassword } from "../helpers/bcrypt.helper.js";
import { COLOR_DICTIONARY } from "../constants/colorData.js";
import { INVENTORY_OPERATIONS } from "../constants/inventoryOperations.js";
import { regionesYComunas } from "../constants/chileData.js";
import { ZONE_PRICES } from "../constants/shippingData.js"; 
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_RUT,
} from "./configEnv.js";

async function isEmpty(repo) {
  return (await repo.count()) === 0;
}

async function createUsers() {
  const repo = AppDataSource.getRepository(User);
  if (!(await isEmpty(repo))) return;

  await repo.save(
    repo.create({
      nombreCompleto: "Administrador Principal",
      rut: ADMIN_RUT,
      email: ADMIN_EMAIL,
      password: await encryptPassword(ADMIN_PASSWORD),
      rol: "administrador",
    }),
  );
  console.log("* => Usuario administrador inicializado con éxito.");
}

async function seedColors(){
  const repo = AppDataSource.getRepository(Color);
  if (!(await isEmpty(repo))) return;

  const entities = COLOR_DICTIONARY.map((c) =>
    repo.create({ name: c.name, hex: c.hex }),
  );
  await repo.save(entities);
  console.log("* => Colores inicializados con éxito.");
}

async function seedOrderStatuses() {
  const repo = AppDataSource.getRepository(OrderStatus);
  if (!(await isEmpty(repo))) return;

 await repo.save([
    { name: "pendiente_de_pago", displayName: "Pendiente de Pago" },
    { name: "en_proceso",        displayName: "En Proceso" },
    { name: "enviado",           displayName: "Enviado" },
    { name: "completado",        displayName: "Completado" },
    { name: "cancelado",         displayName: "Cancelado" },
  ]);
  console.log("* => Estados de órdenes inicializados");
}

export async function seedInventoryOperations(dataSource) {
  const repo = AppDataSource.getRepository(InventoryOperation);
  if (!(await isEmpty(repo))) return;
  
  await repo.save(INVENTORY_OPERATIONS);
    console.log("* => Operaciones de inventario inicializadas");
}


async function seedGeography() {
  const regionRepo = AppDataSource.getRepository(Region);
  const comunaRepo = AppDataSource.getRepository(Comuna);
  if (!(await isEmpty(regionRepo))) return;

  console.log("* => Poblando geografía de Chile...");

  for (const item of regionesYComunas) {
    const region = await regionRepo.save(
      regionRepo.create({ name: item.region, ordinal: item.ordinal }),
    );

    await comunaRepo.save(
      item.comunas.map((nombre) =>
        comunaRepo.create({
          name: nombre,
          region,
          zone: item.zone,
          baseShippingPrice: ZONE_PRICES[item.zone] ?? 7500,
          hasDelivery: true,
        }),
      ),
    );
  }
    console.log("* => Geografía inicializada");
}

export async function initialSetup() {
  try {
    await createUsers();
    await seedColors();
    await seedOrderStatuses();
    await seedInventoryOperations();
    await seedGeography();
    console.log("* => Setup inicial completado");
  } catch (error) {
    console.error("Error en initialSetup:", error);
    throw error; 
  }
}
