"use strict";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import { paymentService } from "../services/payment.service.js";
import { orderService } from "../services/order.service.js";
import crypto from "crypto";
import { MP_ACCESS_TOKEN } from "../config/configEnv.js";

export const createPreference = async (req, res) => {
  try {
    const { orderId } = req.body;
    const [order, error] = await orderService.getOrderById(orderId, req.user?.id, true); 
    
    if (error || !order) return handleErrorClient(res, 404, "Orden no encontrada");

    const preference = await paymentService.createPreference(order);
    handleSuccess(res, 200, "Preferencia creada", preference);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { paymentId, orderId } = req.body;
    
    const paymentData = await paymentService.checkPaymentStatus(paymentId);
    
    if (paymentData && paymentData.status === "approved" && paymentData.external_reference === orderId.toString()) {
      await orderService.updateOrderStatus(orderId, "en_proceso", req.user?.id || null); 
      return handleSuccess(res, 200, "Pago verificado exitosamente", { status: "approved" });
    }

    handleSuccess(res, 200, "Pago pendiente", { status: paymentData?.status || "pending" });
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
};

export const receiveWebhook = async (req, res) => {
  try {
    const { query } = req;
    const topic = query.topic || query.type;
    const paymentId = query.id || query["data.id"];

    if (topic === "payment" && paymentId) {
      const signature = req.headers["x-signature"];
      const requestId = req.headers["x-request-id"];

      if (!signature) return res.status(401).send("Unauthorized");

      const [tsPart, v1Part] = signature.split(",");
      const ts = tsPart?.split("=")[1];
      const v1 = v1Part?.split("=")[1];
      const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
      const expected = crypto
        .createHmac("sha256", MP_ACCESS_TOKEN)
        .update(manifest)
        .digest("hex");

      if (expected !== v1) return res.status(401).send("Invalid signature");

      const paymentData = await paymentService.checkPaymentStatus(paymentId);

      if (paymentData?.status === "approved") {
        const orderId = paymentData.external_reference;
        await orderService.updateOrderStatus(orderId, "en_proceso", null);
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Error en Webhook:", error.message);
    res.status(500).send("Error al procesar Webhook");
  }
};