"use strict";
import User from "../entity/user.entity.js";
import Color from "../entity/color.entity.js";
import { AppDataSource } from "./configDb.js";
import { encryptPassword } from "../helpers/bcrypt.helper.js";
import { COLOR_DICTIONARY } from "../helpers/colorData.js";

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
          email: "user@admin.com",
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

export async function initialSetup() {
  await createUsers();
  await seedColors();
  await seedOrderStatuses();
}
