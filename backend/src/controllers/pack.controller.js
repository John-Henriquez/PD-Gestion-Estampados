import { packService } from "../services/pack.service.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";

export const packController = {
  async getPacks(req, res) {
    try {
      const { id, isActive } = req.query;

      if (id && isNaN(parseInt(id))) {
        return handleErrorClient(res, 400, "ID debe ser un número");
      }

      if (isActive && !["true", "false"].includes(isActive)) {
        return handleErrorClient(
          res,
          400,
          "isActive debe ser 'true' o 'false'",
        );
      }

      const [packs, error] = await packService.getPacks({
        id: id ? parseInt(id) : undefined,
        isActive:
          isActive === "true" ? true : isActive === "false" ? false : undefined,
      });

      if (error) return handleErrorClient(res, 404, error);

      handleSuccess(res, 200, "Packs obtenidos", packs);
    } catch (error) {
      console.error(
        "Error en getPacks controller:",
        error.message,
        error.stack,
      );
      handleErrorServer(res, 500, "Error interno del servidor");
    }
  },
  
  async getPackById(req, res) {
  try {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) {
      return handleErrorClient(res, 400, "ID inválido");
    }

    const [pack, error] = await packService.getPackById(parseInt(id));
    if (error) return handleErrorClient(res, 404, error);

    handleSuccess(res, 200, "Pack obtenido", pack);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
},

  async createPack(req, res) {
    try {
      const [newPack, serviceError] = await packService.createPack({
        ...req.body,
        createdById: req.user.id,
      });

      if (serviceError) return handleErrorClient(res, 400, serviceError);

      handleSuccess(res, 201, "Pack creado correctamente", newPack);
    } catch (error) {
      handleErrorServer(res, 500, error.message);
    }
  },

  async updatePack(req, res) {
    try {
      const { id } = req.params;
      if (!id || isNaN(parseInt(id))) {
        return handleErrorClient(res, 400, "ID debe ser un número");
      }

      const updateData = {
        ...req.body,
        updatedById: req.user.id,
      };

      const [updatedPack, serviceError] = await packService.updatePack(
        parseInt(id),
        updateData,
      );

      if (serviceError) return handleErrorClient(res, 400, serviceError);

      handleSuccess(res, 200, "Pack actualizado correctamente", updatedPack);
    } catch (error) {
      handleErrorServer(res, 500, error.message);
    }
  },

  async deletePack(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!id || isNaN(parseInt(id))) {
        return handleErrorClient(res, 400, "ID debe ser un número");
      }

      if (!userId) {
        return handleErrorClient(res, 401, "Usuario no autenticado");
      }

      const [result, error] = await packService.deletePack(
        parseInt(id),
        userId,
      );
      if (error) return handleErrorClient(res, 404, error);

      handleSuccess(res, 200, result.message, { id: result.id });
    } catch (error) {
      handleErrorServer(res, 500, error.message);
    }
  },

  async restorePack(req, res) {
    try {
      const { id } = req.params;
      if (!id || isNaN(parseInt(id))) {
        return handleErrorClient(res, 400, "ID debe ser un número");
      }

      const [restoredPack, error] = await packService.restorePack(
        parseInt(id),
        req.user.id,
      );
      if (error) return handleErrorClient(res, 404, error);

      handleSuccess(res, 200, "Pack restaurado correctamente", restoredPack);
    } catch (error) {
      handleErrorServer(res, 500, error.message);
    }
  },

  async forceDeletePack(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!id || isNaN(parseInt(id))) {
        return handleErrorClient(res, 400, "ID debe ser un número");
      }

      if (!userId) {
        return handleErrorClient(res, 401, "Usuario no autenticado");
      }

      const [result, error] = await packService.forceDeletePack(
        parseInt(id),
        userId,
      );
      if (error) return handleErrorClient(res, 404, error);

      handleSuccess(res, 200, result.message, { id: result.id });
    } catch (error) {
      handleErrorServer(res, 500, error.message);
    }
  },

  async emptyTrash(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return handleErrorClient(res, 401, "Usuario no autenticado");
      }

      const [deletedCount, error] = await packService.emptyTrash(userId);
      if (error) return handleErrorClient(res, 500, error);

      handleSuccess(
        res,
        200,
        `Papelera vaciada. Packs eliminados: ${deletedCount}`,
      );
    } catch (error) {
      handleErrorServer(res, 500, error.message);
    }
  },
};
