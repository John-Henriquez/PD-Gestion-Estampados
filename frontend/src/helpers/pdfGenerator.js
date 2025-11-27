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
  //doc.text('R.U.T.: 77.123.456-7', 14, 28);
  doc.text('BOLETA ELECTRÓNICA', 14, 33);

  doc.setFontSize(9);
  doc.text('Casa Matriz: Chillán, Chile', 195, 22, { align: 'right' });
  doc.text('Giro: Estampados y Personalización', 195, 27, { align: 'right' });
  doc.text('contacto@vibraestampados.cl', 195, 32, { align: 'right' });

  doc.setDrawColor(200);
  doc.line(14, 38, 196, 38);

  doc.setFontSize(10);
  doc.setTextColor(0);

  const customerName = order.user ? order.user.nombreCompleto : order.customerName || 'Invitado';
  const customerEmail = order.user ? order.user.email : order.guestEmail || '-';
  const customerRut = order.user ? formatRut(order.user.rut) : '-';

  const customerPhone = order.customerPhone || '-';
  const shippingAddress = order.shippingAddress || 'No especificada';

  const dateObj = new Date(order.createdAt);
  const dateFormatted = !isNaN(dateObj) ? dateObj.toLocaleDateString('es-CL') : '-';

  doc.setFont('helvetica', 'bold');
  doc.text(`Orden #: ${order.id}`, 14, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha Emisión: ${dateFormatted}`, 14, 54);

  const colRightX = 110;
  doc.text(`Cliente: ${customerName}`, colRightX, 48);
  doc.text(`RUT: ${customerRut}`, colRightX, 54);
  doc.text(`Email: ${customerEmail}`, colRightX, 60);
  doc.text(`Teléfono: ${customerPhone}`, colRightX, 66);

  let currentY = 76;

  doc.setFont('helvetica', 'bold');
  doc.text('Dirección de Envío:', 14, currentY);
  doc.setFont('helvetica', 'normal');

  const addressLines = doc.splitTextToSize(shippingAddress, 180);
  doc.text(addressLines, 14, currentY + 6);

  const tableStartY = currentY + 6 + (addressLines.length * 5) + 5;

  const tableColumn = ['Producto', 'Detalle', 'Cant.', 'Precio Unit.', 'Total'];
  const tableRows = [];

  order.orderItems.forEach((item) => {
    const itemTotal = item.priceAtTime * item.quantity;
    let description = item.itemNameSnapshot;
    let detailsText = '';

    if (item.pack && item.pack.packItems) {
      description = `PACK: ${item.itemNameSnapshot}`;

      const packContents = item.pack.packItems.map((pi) => {
        const pQty = pi.quantity;
        const pName = pi.itemStock?.itemType?.name || 'Item';
        const pSize = pi.itemStock?.size ? `(${pi.itemStock.size})` : '';
        return ` ${pQty}x ${pName} ${pSize}`;
      });
      detailsText = packContents.join('\n');
    } else {
      let details = [];
      if (item.sizeSnapshot) details.push(`Talla: ${item.sizeSnapshot}`);
      if (item.colorNameSnapshot) {
        details.push(`Color: ${item.colorNameSnapshot}`);
      } else if (item.colorHexSnapshot) {
        details.push('Color personalizado');
      }

      if (item.stampOptionsSnapshot) {
        details.push(`Estampado: ${item.stampOptionsSnapshot.level}`);
      }
      detailsText = details.join(', ') || '-';
    }
    const itemData = [
      description,
      detailsText,
      item.quantity,
      `$${item.priceAtTime.toLocaleString('es-CL')}`,
      `$${itemTotal.toLocaleString('es-CL')}`,
    ];
    tableRows.push(itemData);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: tableStartY,
    theme: 'grid',
    headStyles: { fillColor: [123, 44, 191], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 60 },
      4: { halign: 'right' },
      3: { halign: 'right' },
      2: { halign: 'center' },
    },
  });

  const finalY = doc.lastAutoTable.finalY + 10;

  const total = order.total;
  const neto = Math.round(total / 1.19);
  const iva = total - neto;

  doc.setFontSize(10);
  const rightMargin = 182;
  const labelX = 140;

  doc.text(`Monto Neto:`, labelX, finalY, { align: 'right' });
  doc.text(`$${neto.toLocaleString('es-CL')}`, rightMargin, finalY, { align: 'right' });

  doc.text(`IVA (19%):`, labelX, finalY + 6, { align: 'right' });
  doc.text(`$${iva.toLocaleString('es-CL')}`, rightMargin, finalY + 6, { align: 'right' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL:`, 140, finalY + 14, { align: 'right' });
  doc.text(`$${total.toLocaleString('es-CL')}`, rightMargin, finalY + 14, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100);

  const pageHeight = doc.internal.pageSize.height;
  doc.text('Gracias por preferir a Vibra Estampados.', 105, pageHeight, { align: 'center' });
  doc.text('Documento generado electrónicamente.', 105, pageHeight, { align: 'center' });

  // Descargar
  doc.save(`Boleta_Pedido_${order.id}.pdf`);
};
