import { orderService } from "../services/order.service.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";
import { createOrderSchema } from "../validations/order.validation.js";

export const orderController = {
  async createOrder(req, res) {
    try {
      const { items, customerData } = req.body;
      const userId = req.user?.id;

      const validationContext = {
        isGuest: !userId,
      };

      const { error: validationError, value: validatedData } =
        createOrderSchema.validate(req.body, {
          abortEarly: false,
          context: validationContext,
        });

      if (validationError) {
        const errorDetails = validationError.details.map((d) => ({
          message: d.message,
          path: d.path,
        }));
        console.error("Error de validación Joi:", errorDetails);
        return handleErrorClient(res, 400, "Datos inválidos", errorDetails);
      }

      const [newOrder, error] = await orderService.createOrder(
        validatedData,
        userId,
      );

      if (error) {
        const statusCode = error.includes("Stock insuficiente") ? 409 : 400;
        return handleErrorClient(
          res,
          statusCode,
          "Error al crear el pedido",
          error,
        );
      }

      handleSuccess(res, 201, "Pedido creado exitosamente", newOrder);
    } catch (error) {
      console.error("Error en createOrder controller:", error);
      handleErrorServer(
        res,
        500,
        "Error interno del servidor al crear el pedido.",
      );
    }
  },

  async getMyOrders(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return handleErrorClient(res, 401, "Usuario no autenticado");
      }

      const [orders, error] = await orderService.getOrders(userId, false);

      if (error) {
        return handleErrorClient(res, 404, error);
      }

      handleSuccess(res, 200, "Pedidos del usuario obtenidos", orders);
    } catch (error) {
      console.error("Error en getMyOrders controller:", error);
      handleErrorServer(res, 500, "Error interno al obtener los pedidos.");
    }
  },
  async getAllOrders(req, res) {
    try {
      const userId = req.user?.id;

      const [orders, error] = await orderService.getOrders(null, true);

      if (error) {
        return handleErrorClient(res, 404, error);
      }

      handleSuccess(res, 200, "Todos los pedidos obtenidos (Admin)", orders);
    } catch (error) {
      console.error("Error en getAllOrders controller:", error);
      handleErrorServer(
        res,
        500,
        "Error interno al obtener todos los pedidos.",
      );
    }
  },

  async getOrderById(req, res) {
    try {
      const orderId = parseInt(req.params.id, 10);
      const userId = req.user?.id;
      const isAdminUser = req.user?.rol === "administrador";

      if (isNaN(orderId)) {
        return handleErrorClient(res, 400, "ID de pedido inválido.");
      }

      const [order, error] = await orderService.getOrderById(
        orderId,
        userId,
        isAdminUser,
      );

      if (error) {
        const statusCode = error.includes("permiso") ? 403 : 404;
        return handleErrorClient(res, statusCode, error);
      }

      handleSuccess(res, 200, "Detalle del pedido obtenido", order);
    } catch (error) {
      console.error("Error en getOrderById controller:", error);
      handleErrorServer(
        res,
        500,
        "Error interno al obtener el detalle del pedido.",
      );
    }
  },

  async updateOrderStatus(req, res) {
    try {
      const orderId = parseInt(req.params.id, 10);
      const { status: newStatus } = req.body;
      const adminUserId = req.user?.id;

      if (isNaN(orderId)) {
        return handleErrorClient(res, 400, "ID de pedido inválido.");
      }
      if (!newStatus) {
        return handleErrorClient(res, 400, "Se requiere el nuevo 'status'.");
      }

      const [updatedOrder, error] = await orderService.updateOrderStatus(
        orderId,
        newStatus,
        adminUserId,
      );

      if (error) {
        const statusCode = error.includes("inválido") ? 400 : 404;
        return handleErrorClient(res, statusCode, error);
      }

      handleSuccess(res, 200, "Estado del pedido actualizado", updatedOrder);
    } catch (error) {
      console.error("Error en updateOrderStatus controller:", error);
      handleErrorServer(
        res,
        500,
        "Error interno al actualizar el estado del pedido.",
      );
    }
  },
};
