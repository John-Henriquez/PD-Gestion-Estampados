import PDFDocument from "pdfkit";

export function buildInvoicePdf(order) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    doc.on("error", (err) => {
      reject(err);
    });

    // --- ENCABEZADO ---
    doc.fillColor("#7b2cbf") // Tu color primario
       .fontSize(20)
       .text("Vibra Estampados", 50, 57)
       .fontSize(10)
       .text("Vibra Estampados.", 200, 50, { align: "right" })
       .text("Chillán, Chile", 200, 65, { align: "right" })
       .text("contacto@vibraestampados.cl", 200, 80, { align: "right" })
       .moveDown();

    // --- INFORMACIÓN DE LA ORDEN ---
    doc.fillColor("#000000")
       .fontSize(20)
       .text("BOLETA ELECTRÓNICA", 50, 130);

    doc.fontSize(10)
       .text(`Orden #: ${order.id}`, 50, 200)
       .text(`Fecha: ${new Date().toLocaleDateString("es-CL")}`, 50, 215)
       .text(`Total: $${order.total.toLocaleString("es-CL")}`, 50, 130, { align: "right" }); 

    const customerName = order.user ? order.user.nombreCompleto : (order.customerName || "Invitado");
    doc.text(`Cliente: ${customerName}`, 300, 200, { align: "right" });

    doc.moveDown();
    
    // --- LÍNEA DIVISORIA ---
    doc.strokeColor("#aaaaaa")
       .lineWidth(1)
       .moveTo(50, 250)
       .lineTo(550, 250)
       .stroke();

    // --- TABLA DE PRODUCTOS (Manual simple) ---
    let i = 270;
    
    // Cabecera
    doc.font("Helvetica-Bold");
    doc.text("Item", 50, i);
    doc.text("Cantidad", 370, i, { width: 90, align: "right" });
    doc.text("Precio", 470, i, { align: "right" });
    doc.font("Helvetica");
    
    i += 20;

    // Filas
    order.orderItems.forEach((item) => {
      const price = item.priceAtTime || 0;
      const totalItem = price * item.quantity;
      
      doc.text(item.itemNameSnapshot, 50, i, { width: 300 });
      doc.text(item.quantity.toString(), 370, i, { width: 90, align: "right" });
      doc.text("$" + price.toLocaleString("es-CL"), 470, i, { align: "right" });
      
      i += 20; 
      // Si hay muchas filas, pdfkit crea páginas auto, pero para simplificar asumimos que cabe
    });

    // --- TOTALES ---
    const subtotal = Math.round(order.total / 1.19);
    const iva = order.total - subtotal;

    doc.moveDown();
    doc.text(`Neto: $${subtotal.toLocaleString("es-CL")}`, { align: "right" });
    doc.text(`IVA (19%): $${iva.toLocaleString("es-CL")}`, { align: "right" });
    doc.font("Helvetica-Bold").text(`TOTAL: $${order.total.toLocaleString("es-CL")}`, { align: "right" });

    doc.end();
  });
}