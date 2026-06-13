"use strict";
import User from "../entity/user.entity.js";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/configDb.js";
import { comparePassword, encryptPassword } from "../helpers/bcrypt.helper.js";
import { ACCESS_TOKEN_SECRET } from "../config/configEnv.js";

export async function loginService(user) {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const { email, password } = user;

    const createErrorMessage = (dataInfo, message) => ({
      dataInfo,
      message,
    });

    const userFound = await userRepository.findOne({
      where: { email },
    });

    if (!userFound) {
      return [
        null,
        createErrorMessage("email", "El correo electrónico es incorrecto"),
      ];
    }

    const isMatch = await comparePassword(password, userFound.password);

    if (!isMatch) {
      return [
        null,
        createErrorMessage("password", "La contraseña es incorrecta"),
      ];
    }

    const payload = {
      id: userFound.id,
      nombreCompleto: userFound.nombreCompleto,
      email: userFound.email,
      rut: userFound.rut,
      rol: userFound.rol,
    };

    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
      expiresIn: "1d",
    });

    return [accessToken, null];
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function registerService(user) {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const { nombreCompleto, rut, email } = user;

    const err = (dataInfo, message) => ({ dataInfo, message });

    const existing = await userRepository.findOne({
      where: [{ email }, { rut }],
    });
    if (existing) {
      const field = existing.email === email ? "email" : "rut";
      const msg   = field === "email" ? "Correo electrónico en uso" : "Rut ya asociado a una cuenta";
      return [null, err(field, msg)];
    }

    const newUser = userRepository.create({
      nombreCompleto,
      email,
      rut,
      password: await encryptPassword(user.password),
      rol: "usuario",
    });

    await userRepository.save(newUser);

    const { password, ...dataUser } = newUser;

    return [dataUser, null];
  } catch (error) {
    console.error("Error al registrar un usuario", error);
    return [null, "Error interno del servidor"];
  }
}
