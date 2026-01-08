import transporter from "../config/mailer.js";
import { EMAIL_USER } from "../config/configEnv.js";
import { buildInvoicePdf } from "../helpers/invoiceGenerator.js";

const formatPrice = (price) => {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(price);
};

// Plantilla Base
const getEmailTemplate = (title, color, contentHtml) => {
  return `
    <div style="background-color: #f4f4f4; padding: 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
      <table
        align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
        style="max-width: 600px; background-color: #ffffff; border-radius: 8px;
        overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
      >
        <tr>
          <td style="background-color: ${color}; padding: 30px 20px; text-align: center;">
            <h1
              style="color: #ffffff; margin: 0; font-size: 24px;
              text-transform: uppercase; letter-spacing: 1px;">${title}
            </h1>
          </td>
        </tr>
        
        <tr>
          <td style="padding: 30px 25px; color: #333333; line-height: 1.6;">
            ${contentHtml}
          </td>
        </tr>

        <tr>
          <td style="background-color: #333333; padding: 20px; text-align: center; color: #888888; font-size: 12px;">
            <p style="margin: 0;">Vibra Estampados</p>
            <p style="margin: 5px 0;">Chillán, Región de Ñuble, Chile</p>
              <a
                href="${process.env.VITE_BASE_URL || "#"}" style="color: #ffffff; text-decoration: none;">Visitar Tienda
              </a>
          </td>
        </tr>
      </table>
    </div>
  `;
};

async function sendEmail(to, subject, htmlContent, attachments = []) {
  try {
    const info = await transporter.sendMail({
      from: `"Vibra Estampados" <${EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent,
      attachments: attachments,
    });
    return [info, null];
  } catch (error) {
    console.error("Error al enviar el correo:", error);
    return [null, "Error al enviar el correo"];
  }
}

// Generador de PDF
async function generatePdfAttachment(order) {
  try {
    const pdfBuffer = await buildInvoicePdf(order);
    return [{
      filename: `Boleta_Vibra_${order.id}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf"
    }];
  } catch (error) {
    console.error("Error generando PDF:", error);
    return [];
  }
}

// 1. ESTADO: PENDIENTE DE PAGO (Creación)
export async function sendOrderCreatedEmail(order) {
  const emailDestino = order.user ? order.user.email : order.guestEmail;
  const nombre = order.user ? order.user.nombreCompleto : (order.customerName || "Cliente");

  const content = `
    <p style="font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
    <p>
      Hemos recibido tu pedido <strong>#${order.id}</strong> correctamente.
      Actualmente se encuentra <strong style="color: #f39c12;">Pendiente de Pago</strong>.
    </p>
    
    <div style="background-color: #fff8e1; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Total a Pagar:</strong> ${formatPrice(order.total)}</p>
    </div>

    <p>Una vez confirmado el pago, comenzaremos a procesar tu orden.</p>
  `;

  const html = getEmailTemplate("Pedido Recibido", "#f39c12", content); 
  return sendEmail(emailDestino, `Pedido Recibido #${order.id}`, html);
}

// 2. ESTADO: EN PROCESO (Pago Exitoso)
export async function sendOrderPaidEmail(order) {
  const emailDestino = order.user ? order.user.email : order.guestEmail;
  const nombre = order.user ? order.user.nombreCompleto : (order.customerName || "Cliente");
  const attachments = await generatePdfAttachment(order);

  const content = `
    <p style="font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
    <p>
      ¡Buenas noticias! Hemos confirmado tu pago.
      Tu pedido <strong>#${order.id}</strong> ha pasado al estado
        <strong style="color: #2980b9;">En Proceso</strong>.
    </p>
    
    <p>Nuestro equipo ya está trabajando en preparar tus productos.</p>

    <div style="background-color: #eaf2f8; border-left: 4px solid #2980b9; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;">
        <strong>Boleta Adjunta:</strong> 
        Hemos adjuntado tu comprobante de compra en este correo.
      </p>
    </div>
  `;

  const html = getEmailTemplate("Pago Confirmado", "#2980b9", content);
  return sendEmail(emailDestino, `Boleta y Confirmación - Pedido #${order.id}`, html, attachments);
}

// 3. ESTADO: ENVIADO
export async function sendOrderShippedEmail(order) {
  const emailDestino = order.user ? order.user.email : order.guestEmail;
  const nombre = order.user ? order.user.nombreCompleto : (order.customerName || "Cliente");
  
  const content = `
    <p style="font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
    <p>¡Tu pedido va en camino! El estado ha cambiado a <strong style="color: #8e44ad;">Enviado</strong>.</p>
    
    <p>Pronto recibirás tus productos de Vibra Estampados en la dirección que indicaste.</p>
    
    <div style="text-align: center; margin-top: 30px;">
      <a
        href="${process.env.VITE_BASE_URL}/my-orders" style="background-color: #8e44ad; color: white;
        padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Ver Mis Pedidos
      </a>
    </div>
  `;
  const html = getEmailTemplate("Pedido Enviado", "#8e44ad", content);
  return sendEmail(emailDestino, `Actualización Pedido #${order.id}`, html);
}

// 4. ESTADO: COMPLETADO
export async function sendOrderCompletedEmail(order) {
  const emailDestino = order.user ? order.user.email : order.guestEmail;
  const nombre = order.user ? order.user.nombreCompleto : (order.customerName || "Cliente");

  const content = `
    <p
      style="font-size: 16px;">Hola <strong>${nombre}</strong>,
    </p>
    <p>
      Tu pedido <strong>#${order.id}</strong>
      ha sido marcado como <strong style="color: #27ae60;">Completado</strong>.
    </p>
    
    <p>Esperamos que disfrutes tus productos tanto como nosotros disfrutamos creándolos.</p>
    <p>¡Gracias por confiar en Vibra Estampados!</p>
  `;

  const html = getEmailTemplate("Pedido Completado", "#27ae60", content); 
  return sendEmail(emailDestino, `¡Gracias por tu compra! - Pedido #${order.id}`, html);
}

// 5. ESTADO: CANCELADO
export async function sendOrderCancelledEmail(order) {
  const emailDestino = order.user ? order.user.email : order.guestEmail;
  const nombre = order.user ? order.user.nombreCompleto : (order.customerName || "Cliente");

  const content = `
    <p style="font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
    <p>
      Te informamos que tu pedido <strong>#${order.id}</strong>
      ha sido <strong style="color: #c0392b;">Cancelado</strong>.</p>
    
    <p>
      Si crees que esto es un error o necesitas más información sobre el reembolso,
      por favor contáctanos respondiendo a este correo.
    </p>
  `;

  const html = getEmailTemplate("Pedido Cancelado", "#c0392b", content); 
  return sendEmail(emailDestino, `Pedido Cancelado #${order.id}`, html);
}

export async function sendLowStockAlert(stockItem, currentQty) {
  const content = `
    <p style="font-size: 16px;"> <strong>ALERTA DE STOCK CRÍTICO</strong></p>
    <p>El siguiente producto ha alcanzado un nivel de inventario bajo:</p>
    
    <div style="background-color: #fff1f0; border-left: 4px solid #cf1322; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Producto:</strong> ${stockItem.itemType?.name || 'Desconocido'}</p>
      <p style="margin: 5px 0;"><strong>Variación:</strong> Talla ${stockItem.size} - Color ${stockItem.color?.name || 'N/A'}</p>
      <p style="margin: 5px 0; color: #cf1322; font-size: 18px;"><strong>Stock Restante:</strong> ${currentQty} unidades</p>
    </div>

    <p>Se recomienda gestionar la reposición a la brevedad para evitar quiebres de stock en la tienda.</p>
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.VITE_BASE_URL || '#'}/admin/inventory" 
         style="background-color: #333333; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
         Ir al Panel de Inventario
      </a>
    </div>
  `;

  const html = getEmailTemplate("Emergencia de Stock", "#cf1322", content);
  return sendEmail(EMAIL_USER, `Stock Bajo: ${stockItem.itemType?.name}`, html);
}