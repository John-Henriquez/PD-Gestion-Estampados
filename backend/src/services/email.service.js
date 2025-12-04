import transporter from "../config/mailer.js";
import { EMAIL_USER } from "../config/configEnv.js";
import { buildInvoicePdf } from "../helpers/invoiceGenerator.js";

const formatPrice = (price) => {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(price);
};

// 1. Función Base para Enviar Correos
export async function sendEmail(to, subject, htmlContent, attachments = []) {
  try {
    const info = await transporter.sendMail({
      from: `"Vibra Estampados" <${EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent,
      attachments: attachments,
    });
    console.log("📩 Correo enviado:", info.messageId);
    return [info, null];
  } catch (error) {
    console.error("❌ Error al enviar el correo:", error);
    return [null, "Error al enviar el correo"];
  }
}

// 2. Helper para generar el PDF
async function generatePdfAttachment(order) {
  try {
    const pdfBuffer = await buildInvoicePdf(order);
    return [{
      filename: `Boleta_Vibra_${order.id}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf"
    }];
  } catch (error) {
    console.error("⚠️ Error generando PDF:", error);
    return [];
  }
}

// 3. Correo de Confirmación de Creación (Sin PDF, solo aviso)
export async function sendOrderConfirmationEmail(order) {
  const emailDestino = order.user ? order.user.email : order.guestEmail;
  const nombreCliente = order.user ? order.user.nombreCompleto : (order.customerName || "Cliente");

  const html = `
    <div
      style="font-family: sans-serif; color: #333; max-width: 600px;
      margin: auto; border: 1px solid #eee; border-radius: 8px;"
    >
      <div style="background-color: #7b2cbf; padding: 20px; text-align: center; color: white;">
        <h2>¡Pedido Recibido!</h2>
      </div>
      <div style="padding: 20px;">
        <p>Hola <strong>${nombreCliente}</strong>,</p>
        <p>Tu pedido <strong>#${order.id}</strong> ha sido registrado.</p>
        <p>Total: <strong>${formatPrice(order.total)}</strong></p>
        <p style="color: #666; font-size: 14px;">Te avisaremos cuando confirmemos el pago.</p>
      </div>
    </div>
  `;

  return sendEmail(emailDestino, `Pedido Recibido #${order.id}`, html);
}

// 4. Correo de "Pago Exitoso" / En Proceso (CON PDF ADJUNTO)
export async function sendPaymentSuccessEmail(order) {
  const emailDestino = order.user ? order.user.email : order.guestEmail;
  const nombreCliente = order.user ? order.user.nombreCompleto : (order.customerName || "Cliente");

  // Generamos PDF
  const attachments = await generatePdfAttachment(order);

  const html = `
    <div
      style="font-family: sans-serif; color: #333; max-width: 600px;
      margin: auto; border: 1px solid #eee; border-radius: 8px;"
    >
      <div style="background-color: #2ecc71; padding: 20px; text-align: center; color: white;">
        <h2>¡Pago Confirmado!</h2>
      </div>
      <div style="padding: 20px;">
        <p>Hola <strong>${nombreCliente}</strong>,</p>
        <p>Hemos confirmado el pago de tu pedido <strong>#${order.id}</strong> y ya estamos trabajando en él.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2ecc71; margin: 20px 0;">
          <p
            style="margin:0;">
              <strong>
                Boleta Adjunta:
              </strong>
              Encuentra el detalle de tu compra en el PDF adjunto a este correo.
          </p>
        </div>

        <p style="font-size: 12px; color: #999; text-align: center;">Vibra Estampados</p>
      </div>
    </div>
  `;

  return sendEmail(emailDestino, `Boleta y Confirmación - Pedido #${order.id}`, html, attachments);
}

// 5. Correo Genérico de Cambio de Estado (Sin PDF)
export async function sendOrderStatusUpdateEmail(order) {
  const emailDestino = order.user ? order.user.email : order.guestEmail;
  const nombreCliente = order.user ? order.user.nombreCompleto : (order.customerName || "Cliente");
  
  const html = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto;">
      <h2 style="color: #ff7900;">Actualización de Pedido #${order.id}</h2>
      <p>
        Hola ${nombreCliente}, tu pedido ha pasado al estado: 
        <strong>
          ${order.status.toUpperCase().replace(/_/g, " ")}
        </strong>
      </p>
    </div>
  `;
  
  return sendEmail(emailDestino, `Actualización Pedido #${order.id}`, html);
}