"use strict";
import User from "../entity/user.entity.js";
import Color from "../entity/color.entity.js";
import Region from "../entity/region.entity.js";
import Comuna from "../entity/comuna.entity.js";
import { AppDataSource } from "./configDb.js";
import { encryptPassword } from "../helpers/bcrypt.helper.js";
import { COLOR_DICTIONARY } from "../constants/colorData.js";
import { INVENTORY_OPERATIONS } from "../constants/inventoryOperations.js";
import { regionesYComunas } from "../constants/chileData.js";
import InventoryOperation from "../entity/inventoryOperation.entity.js";

export async function seedInventoryOperations(dataSource) {
  const repo = dataSource.getRepository(InventoryOperation);
  
  const count = await repo.count();
  if (count > 0) return;

  console.log("* => Poblando tabla de operaciones de inventario...");
  
  await repo.save(INVENTORY_OPERATIONS);
  
  console.log("* => Operaciones de inventario inicializadas con éxito.");
}

async function createUsers() {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const count = await userRepository.count();
    if (count > 0) return;
    await Promise.all([
      userRepository.save(
        userRepository.create({
          nombreCompleto: "Administrador Principal",
          rut: "11.111.111-1",
          email: "notificaciones.vibraes@gmail.com",
          password: await encryptPassword("admin123"),
          rol: "administrador",
        }),
      ),
    ]);
    console.log("* => Usuarios creados exitosamente");
  } catch (error) {
    console.error("Error al crear usuarios:", error);
  }
}

async function seedColors(){
try {
    const colorRepository = AppDataSource.getRepository(Color);
    const count = await colorRepository.count();
    
    if (count > 0) return;

    const colorEntities = COLOR_DICTIONARY.map(color => 
      colorRepository.create({
        name: color.name,
        hex: color.hex
      })
    );

    await colorRepository.save(colorEntities);
    console.log("* => Colores de inventario inicializados exitosamente");
  } catch (error) {
    console.error("Error al inicializar colores:", error);
  }
}

async function seedOrderStatuses() {
  try {
    const statusRepo = AppDataSource.getRepository("OrderStatus");
    const count = await statusRepo.count();
    if (count > 0) return;

    const statuses = [
      { name: "pendiente_de_pago", displayName: "Pendiente de Pago" },
      { name: "en_proceso", displayName: "En Proceso" },
      { name: "enviado", displayName: "Enviado" },
      { name: "completado", displayName: "Completado" },
      { name: "cancelado", displayName: "Cancelado" },
    ];

    await statusRepo.save(statuses);
    console.log("* => Estados de órdenes inicializados exitosamente");
  } catch (error) {
    console.error("Error al inicializar estados:", error);
  }
}

async function seedGeography() {
  try {
    const regionRepo = AppDataSource.getRepository(Region);
    const comunaRepo = AppDataSource.getRepository(Comuna);

    const count = await regionRepo.count();
    if (count > 0) return;

    console.log("* => Poblando geografía de Chile y tarifas referenciales...");

    const ZONE_PRICES = {
      'LOCAL': 2000,
      'SUR_CERCANO': 5500,
      'CENTRO': 7500,
      'NORTE': 8500,
      'SUR': 9500,
      'NORTE_EXTREMO': 12500,
      'SUR_EXTREMO': 15000
    };
    for (const item of regionesYComunas) {
      const region = regionRepo.create({ 
        name: item.region, 
        ordinal: item.ordinal 
      });
      const savedRegion = await regionRepo.save(region);

      const priceRef = ZONE_PRICES[item.zone] || 7500;

      const comunasEntities = item.comunas.map((nombreComuna) => {
        return comunaRepo.create({
          name: nombreComuna,
          region: savedRegion,
          zone: item.zone,
          baseShippingPrice: priceRef,
          hasDelivery: true
        });
      });

      await comunaRepo.save(comunasEntities);
    }

    console.log("* => Geografía y logística inicializada con éxito.");
  } catch (error) {
    console.error("Error al inicializar geografía:", error);
  }
}

export async function initialSetup() {
  await createUsers();
  await seedColors();
  await seedOrderStatuses();
  await seedInventoryOperations(AppDataSource);
  await seedGeography();
}
