import { getSolicitudService } from "../services/solicitud.service.js";
import { handleErrorClient } from "../handlers/responseHandlers.js";

export async function verifyUserPermission(req, res, next) {
  try {
    const solicitud = await getSolicitudService(req.params.id_solicitud);

    if (!solicitud) {
      return handleErrorClient(res, 404, "Solicitud no encontrada");
    }

    if (req.user && req.user.rol === "administrador") {
      return next();
    }

    if (solicitud.rut_creador !== req.user.rut) {
      return handleErrorClient(
        res,
        403,
        "No tienes permiso para acceder a esta solicitud",
      );
    }

    next();
  } catch (error) {
    return handleErrorClient(res, 500, "Error interno del servidor");
  }
}
