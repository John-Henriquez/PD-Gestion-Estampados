import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { FRONTEND_URL, MP_ACCESS_TOKEN } from "../config/configEnv.js";

const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });

export const paymentService = {
  // 1. Crear la Preferencia
  async createPreference(order) {
    try {
      const preference = new Preference(client);

      const items = order.orderItems.map((item) => ({
        id: item.id.toString(),
        title: item.itemNameSnapshot,
        quantity: item.quantity,
        unit_price: Number(item.priceAtTime), 
        currency_id: "CLP",
      }));

      const result = await preference.create({
        body: {
          items: items,
          external_reference: order.id.toString(),
          payer: {
            name: order.customerName || order.user?.nombreCompleto || "Cliente",
            email: order.guestEmail || order.user?.email || "test_user@test.com",
          },
          back_urls: {
            success: `${FRONTEND_URL}/order-confirmation/${order.id}`,
            failure: `${FRONTEND_URL}/order-confirmation/${order.id}`,
            pending: `${FRONTEND_URL}/order-confirmation/${order.id}`,
          },
          auto_return: "approved",
        },
      });

      return { id: result.id, init_point: result.init_point, sandbox_init_point: result.sandbox_init_point };
    } catch (error) {
      console.error("Error al crear preferencia MP:", error);
      throw new Error("No se pudo generar el pago");
    }
  },

  // 2. Verificar el estado del pago 
  async checkPaymentStatus(paymentId) {
    try {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: paymentId });
      
      return {
        status: paymentData.status, 
        external_reference: paymentData.external_reference,
        payment_method: paymentData.payment_method_id
      };
    } catch (error) {
      console.error("Error consultando pago MP:", error);
      return null;
    }
  }
};