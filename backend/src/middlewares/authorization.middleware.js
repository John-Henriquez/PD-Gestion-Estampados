import User from "../entity/user.entity.js";
import { AppDataSource } from "../config/configDb.js";
import {
  handleErrorClient,
  handleErrorServer,
} from "../handlers/responseHandlers.js";

export function isAdmin(req, res, next) {
  if (!req.user) {
    return handleErrorClient(res, 401, "No autenticado");
  }
  if (req.user.rol !== "administrador") {
    return handleErrorClient(
      res, 403,
      "Se requiere rol de administrador para realizar esta acción",
    );
  }
  next();
}
