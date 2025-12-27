import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { FRONTEND_URL, MP_ACCESS_TOKEN } from "../config/configEnv.js";

const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });

export const paymentService = {
async createPreference(order) {
    try {
      const preference = new Preference(client);
      const tunnelUrl = "https://uncomplacent-sheena-entomologically.ngrok-free.dev";
      const returnUrl = `${tunnelUrl}/order-confirmation/${order.id}`;
      
      const body = {
        items: order.orderItems.map((item) => ({
          id: String(item.id),
          title: String(item.itemNameSnapshot).substring(0, 250), 
          quantity: Number(item.quantity),
          unit_price: Math.round(Number(item.priceAtTime)),
          currency_id: "CLP",
        })),
        external_reference: String(order.id),
        notification_url: "https://uncomplacent-sheena-entomologically.ngrok-free.dev/api/payments/webhook",
        back_urls: {
          success: returnUrl,
          failure: returnUrl,
          pending: returnUrl,
        },
        auto_return: "approved",
      };

      const result = await preference.create({ body });

      return { 
        id: result.id, 
        init_point: result.init_point, 
        sandbox_init_point: result.sandbox_init_point 
      };

    } catch (error) {
      if (error.response && error.response.data) {
        console.error("ERROR DETALLADO DE MERCADO PAGO:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.error("Error al crear preferencia:", error.message);
      }
      throw error;
    }
  },

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