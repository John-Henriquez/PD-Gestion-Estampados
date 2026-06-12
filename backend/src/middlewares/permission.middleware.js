"use strict";
import { AppDataSource } from "../config/configDb.js";
import Order from "../entity/order.entity.js";
import { handleErrorClient } from "../handlers/responseHandlers.js";

export async function verifyOrderOwnership(req, res, next) {
  try {
    if (req.user?.rol === "administrador") return next();

    const repo = AppDataSource.getRepository(Order);
    const order = await repo.findOne({
      where: { id: Number(req.params.id) },
      relations: ["user"],
    });

    if (!order) {
      return handleErrorClient(res, 404, "Pedido no encontrado");
    }

    if (order.user?.id !== req.user.id) {
      return handleErrorClient(res, 403, "No tienes permiso para acceder a este pedido");
    }

    next();
  } catch (error) {
    return handleErrorClient(res, 500, "Error interno del servidor");
  }
}