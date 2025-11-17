import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format as formatRut } from 'rut.js';

export const generateOrderReceipt = (order) => {
  const doc = new jsPDF();

  //Encabezado
  doc.setFontSize(20);
  doc.setTextColor(123, 44, 191);
  doc.text('Vibra Estampados', 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('R.U.T.: 77.123.456-7', 14, 28);
  doc.text('BOLETA ELECTRÓNICA', 14, 33);

  doc.setFontSize(9);
  doc.text('Casa Matriz: Concepción, Chile', 195, 22, { align: 'right' });
  doc.text('Giro: Estampados y Personalización', 195, 27, { align: 'right' });
  doc.text('contacto@vibraestampados.cl', 195, 32, { align: 'right' });

  doc.setDrawColor(200);
  doc.line(14, 38, 196, 38);

  doc.setFontSize(10);
  doc.setTextColor(0);

  const customerName = order.user ? order.user.nombreCompleto : order.customerName || 'Invitado';
  const customerEmail = order.user ? order.user.email : order.guestEmail || '-';
  const customerRut = order.user ? formatRut(order.user.rut) : '-';

  const dateObj = new Date(order.createdAt);
  const dateFormatted = !isNaN(dateObj) ? dateObj.toLocaleDateString('es-CL') : '-';

  doc.text(`Orden #: ${order.id}`, 14, 48);
  doc.text(`Fecha Emisión: ${dateFormatted}`, 14, 54);

  doc.text(`Cliente: ${customerName}`, 110, 48);
  doc.text(`RUT: ${customerRut}`, 110, 54);
  doc.text(`Email: ${customerEmail}`, 110, 60);

  const tableColumn = ['Producto', 'Detalle', 'Cant.', 'Precio Unit.', 'Total'];
  const tableRows = [];

  order.orderItems.forEach((item) => {
    const itemTotal = item.priceAtTime * item.quantity;

    let description = item.itemNameSnapshot;
    if (item.pack) description = `PACK: ${description}`;

    let details = [];
    if (item.sizeSnapshot) details.push(`Talla: ${item.sizeSnapshot}`);
    if (item.colorNameSnapshot) details.push(`Color: ${item.colorNameSnapshot}`);
    else if (item.colorHexSnapshot) details.push('Color personalizado');

    const itemData = [
      description,
      details.join(', ') || '-',
      item.quantity,
      `$${item.priceAtTime.toLocaleString('es-CL')}`,
      `$${itemTotal.toLocaleString('es-CL')}`,
    ];
    tableRows.push(itemData);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 70,
    theme: 'grid',
    headStyles: { fillColor: [123, 44, 191], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 60 },
      4: { halign: 'right' },
      3: { halign: 'right' },
    },
  });

  const finalY = doc.lastAutoTable.finalY + 10;

  const total = order.total;
  const neto = Math.round(total / 1.19);
  const iva = total - neto;

  doc.setFontSize(10);
  const rightMargin = 182;
  doc.text(`Monto Neto:`, 140, finalY, { align: 'right' });
  doc.text(`$${neto.toLocaleString('es-CL')}`, rightMargin, finalY, { align: 'right' });

  doc.text(`IVA (19%):`, 140, finalY + 6, { align: 'right' });
  doc.text(`$${iva.toLocaleString('es-CL')}`, rightMargin, finalY + 6, { align: 'right' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL:`, 140, finalY + 14, { align: 'right' });
  doc.text(`$${total.toLocaleString('es-CL')}`, rightMargin, finalY + 14, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica", "italic');
  doc.setTextColor(100);
  doc.text('Gracias por preferir a Vibra Estampados.', 105, 280, { align: 'center' });
  doc.text('Documento generado electrónicamente.', 105, 285, { align: 'center' });

  // Descargar
  doc.save(`Boleta_Pedido_${order.id}.pdf`);
};
