import { paymentService } from "../services/payment.service.js";
import { orderService } from "../services/order.service.js";

export const createPreference = async (req, res) => {
  try {
    const { orderId } = req.body;
    const [order, error] = await orderService.getOrderById(orderId, req.user?.id, true); 
    
    if (error || !order) return res.status(404).json({ message: "Orden no encontrada" });

    const preference = await paymentService.createPreference(order);
    res.json({ data: preference });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { paymentId, orderId } = req.body;
    
    const paymentData = await paymentService.checkPaymentStatus(paymentId);
    
    if (paymentData && paymentData.status === "approved" && paymentData.external_reference === orderId.toString()) {
      await orderService.updateOrderStatus(orderId, "en_proceso", req.user?.id || 1); 
      return res.json({ status: "approved", message: "Pago verificado exitosamente" });
    }

    res.json({ status: paymentData?.status || "pending", message: "El pago no está aprobado aún" });
  } catch (error) {
    res.status(500).json({ message: "Error al verificar pago" });
  }
};