import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatINR, formatInvoiceDate } from './gst.js';

export function downloadInvoicePDF(invoice) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const isIntra = invoice.supplyType === 'INTRA';

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(String(invoice.documentType || 'TAX INVOICE').toUpperCase(), pageWidth / 2, 12, {
    align: 'center',
  });

  const topY = 15;
  const leftW = contentWidth * 0.5;
  const rightW = contentWidth * 0.5;
  const rightX = margin + leftW;

  // Draw Left Header Box (Seller + Buyer)
  const sellerH = 34;
  const buyerH = 32;
  const headerH = sellerH + buyerH;

  doc.setDrawColor(60);
  doc.setLineWidth(0.25);
  doc.rect(margin, topY, leftW, sellerH);
  doc.rect(margin, topY + sellerH, leftW, buyerH);

  // Seller Info
  let y = topY + 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(invoice.seller?.name || 'IJAZ TRADERS', margin + 2, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const sellerAddrLines = doc.splitTextToSize(invoice.seller?.address || '', leftW - 4);
  doc.text(sellerAddrLines, margin + 2, y);
  y += sellerAddrLines.length * 3.3;
  doc.text(`GSTIN/UIN: ${invoice.seller?.gstin || ''}`, margin + 2, y);
  y += 3.5;
  doc.text(
    `State Name : ${invoice.seller?.stateName || ''}, Code : ${invoice.seller?.stateCode || ''}`,
    margin + 2,
    y
  );
  y += 3.5;
  doc.text(`Contact : ${invoice.seller?.contact || ''}`, margin + 2, y);
  y += 3.5;
  doc.text(`E-Mail : ${invoice.seller?.email || ''}`, margin + 2, y);

  // Buyer Info
  y = topY + sellerH + 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Buyer (Bill to)', margin + 2, y);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(invoice.buyer?.name || '', margin + 2, y);
  y += 3.8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const buyerAddrLines = doc.splitTextToSize(invoice.buyer?.address || '', leftW - 4);
  doc.text(buyerAddrLines, margin + 2, y);
  y += buyerAddrLines.length * 3.3;
  if (invoice.buyer?.phone) {
    doc.text(invoice.buyer.phone, margin + 2, y);
    y += 3.5;
  }
  doc.text(
    `GSTIN/UIN  : ${invoice.buyer?.isRegistered ? invoice.buyer?.gstin : 'Unregistered'}`,
    margin + 2,
    y
  );
  y += 3.5;
  doc.text(
    `State Name : ${invoice.buyer?.stateName || ''}, Code : ${invoice.buyer?.stateCode || ''}`,
    margin + 2,
    y
  );

  // Right Metadata Grid (8 rows)
  const d = invoice.dispatchDetails || {};
  const metaRows = [
    [
      { label: 'Invoice No.          e-Way Bill No.', val: `${invoice.invoiceNumber}${invoice.eWayBillNo ? '   ' + invoice.eWayBillNo : ''}` },
      { label: 'Dated', val: formatInvoiceDate(invoice.invoiceDate) },
    ],
    [
      { label: 'Delivery Note', val: d.deliveryNote || '' },
      { label: 'Mode/Terms of Payment', val: d.modeOfPayment || '' },
    ],
    [
      { label: 'Reference No. & Date.', val: d.referenceNoAndDate || '' },
      { label: 'Other References', val: d.otherReferences || '' },
    ],
    [
      { label: "Buyer's Order No.", val: d.buyersOrderNo || '' },
      { label: 'Dated', val: d.buyersOrderDate || '' },
    ],
    [
      { label: 'Dispatch Doc No.', val: d.dispatchDocNo || '' },
      { label: 'Delivery Note Date', val: d.deliveryNoteDate || '' },
    ],
    [
      { label: 'Dispatched through', val: d.dispatchedThrough || '' },
      { label: 'Destination', val: d.destination || '' },
    ],
    [
      { label: 'Bill of Lading/LR-RR No.', val: d.billOfLadingNo || '' },
      { label: 'Motor Vehicle No.', val: d.motorVehicleNo || '' },
    ],
  ];

  const rowH = 7.5;
  const colW = rightW / 2;
  metaRows.forEach((pair, rIdx) => {
    const ry = topY + rIdx * rowH;
    pair.forEach((cell, cIdx) => {
      const cx = rightX + cIdx * colW;
      doc.rect(cx, ry, colW, rowH);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text(cell.label, cx + 1.5, ry + 2.8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(String(cell.val || ''), cx + 1.5, ry + 6.2);
    });
  });

  // 8th row: Terms of Delivery (full right width)
  const termsY = topY + 7 * rowH;
  const termsH = headerH - 7 * rowH;
  doc.rect(rightX, termsY, rightW, termsH);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Terms of Delivery', rightX + 1.5, termsY + 3);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(d.termsOfDelivery || '', rightX + 1.5, termsY + 7);

  // Line Items Table
  const itemBody = (invoice.items || []).map((item, idx) => [
    String(idx + 1),
    item.subDescription ? `${item.description}\n${item.subDescription}` : item.description,
    item.hsnSac,
    `${item.quantity} ${item.unit}`,
    formatINR(item.rateInclTax),
    formatINR(item.rate),
    item.unit,
    formatINR(item.taxableValue),
  ]);

  // Tax Summary rows inside main table
  itemBody.push([
    '',
    { content: 'Taxable Subtotal', styles: { halign: 'right', fontStyle: 'bold' } },
    '',
    '',
    '',
    '',
    '',
    { content: formatINR(invoice.totals?.subtotalTaxable), styles: { fontStyle: 'bold' } },
  ]);

  if (isIntra) {
    itemBody.push([
      '',
      { content: 'CGST', styles: { halign: 'right', fontStyle: 'bold' } },
      '',
      '',
      '',
      '',
      '',
      { content: formatINR(invoice.totals?.totalCgst), styles: { fontStyle: 'bold' } },
    ]);
    itemBody.push([
      '',
      { content: 'SGST', styles: { halign: 'right', fontStyle: 'bold' } },
      '',
      '',
      '',
      '',
      '',
      { content: formatINR(invoice.totals?.totalSgst), styles: { fontStyle: 'bold' } },
    ]);
  } else {
    itemBody.push([
      '',
      { content: 'IGST', styles: { halign: 'right', fontStyle: 'bold' } },
      '',
      '',
      '',
      '',
      '',
      { content: formatINR(invoice.totals?.totalIgst), styles: { fontStyle: 'bold' } },
    ]);
  }

  itemBody.push([
    '',
    { content: 'ROUND OFF', styles: { halign: 'right', fontStyle: 'bold' } },
    '',
    '',
    '',
    '',
    '',
    { content: formatINR(invoice.totals?.roundOff), styles: { fontStyle: 'bold' } },
  ]);

  itemBody.push([
    '',
    { content: 'Total', styles: { halign: 'right', fontStyle: 'bold', fontSize: 8.5 } },
    '',
    '',
    '',
    '',
    '',
    { content: `Rs. ${formatINR(invoice.totals?.grandTotal)}`, styles: { fontStyle: 'bold', fontSize: 8.5 } },
  ]);

  autoTable(doc, {
    startY: topY + headerH,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      lineColor: [60, 60, 60],
      lineWidth: 0.25,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [248, 250, 252],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 66 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 24, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 11, halign: 'center' },
      7: { cellWidth: 22, halign: 'right' },
    },
    head: [['Sl No.', 'Description of Goods', 'HSN/SAC', 'Quantity', 'Rate (Incl. Tax)', 'Rate', 'per', 'Amount']],
    body: itemBody,
  });

  let curY = doc.lastAutoTable.finalY + 3;

  // Amount in words
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Amount Chargeable (in words)', margin, curY + 2);
  doc.text('E. & O.E', pageWidth - margin, curY + 2, { align: 'right' });
  curY += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(invoice.amountInWords || '', margin, curY);
  curY += 3;

  // HSN/SAC Breakdown Table
  const hsnHead = isIntra
    ? [['HSN/SAC', 'Taxable Value', 'CGST Rate', 'CGST Amount', 'SGST Rate', 'SGST Amount', 'Total Tax Amount']]
    : [['HSN/SAC', 'Taxable Value', 'IGST Rate', 'IGST Amount', 'Total Tax Amount']];

  const hsnBody = (invoice.hsnSummary || []).map((h) =>
    isIntra
      ? [
          h.hsnSac,
          formatINR(h.taxableValue),
          `${h.cgstRate}%`,
          formatINR(h.cgstAmount),
          `${h.sgstRate}%`,
          formatINR(h.sgstAmount),
          formatINR(h.totalTaxAmount),
        ]
      : [h.hsnSac, formatINR(h.taxableValue), `${h.igstRate}%`, formatINR(h.igstAmount), formatINR(h.totalTaxAmount)]
  );

  hsnBody.push(
    isIntra
      ? [
          { content: 'Total', styles: { fontStyle: 'bold' } },
          { content: formatINR(invoice.totals?.subtotalTaxable), styles: { fontStyle: 'bold' } },
          '',
          { content: formatINR(invoice.totals?.totalCgst), styles: { fontStyle: 'bold' } },
          '',
          { content: formatINR(invoice.totals?.totalSgst), styles: { fontStyle: 'bold' } },
          { content: formatINR(invoice.totals?.totalTax), styles: { fontStyle: 'bold' } },
        ]
      : [
          { content: 'Total', styles: { fontStyle: 'bold' } },
          { content: formatINR(invoice.totals?.subtotalTaxable), styles: { fontStyle: 'bold' } },
          '',
          { content: formatINR(invoice.totals?.totalIgst), styles: { fontStyle: 'bold' } },
          { content: formatINR(invoice.totals?.totalTax), styles: { fontStyle: 'bold' } },
        ]
  );

  autoTable(doc, {
    startY: curY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 7.2,
      cellPadding: 1.5,
      lineColor: [60, 60, 60],
      lineWidth: 0.25,
      textColor: [0, 0, 0],
      halign: 'right',
    },
    headStyles: {
      fillColor: [248, 250, 252],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: { 0: { halign: 'center' } },
    head: hsnHead,
    body: hsnBody,
  });

  curY = doc.lastAutoTable.finalY + 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Tax Amount (in words) :  `, margin, curY);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.taxAmountInWords || '', margin + 33, curY);

  curY += 6;
  const bank = invoice.seller?.bankDetails || {};
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text("Company's Bank Details", margin + contentWidth * 0.45, curY);
  doc.text('Declaration', margin, curY);
  curY += 4;

  const declLines = doc.splitTextToSize(invoice.declaration || '', contentWidth * 0.42);
  doc.text(declLines, margin, curY);

  const bx = margin + contentWidth * 0.45;
  doc.text(`A/c Holder's Name : ${bank.accountHolderName || ''}`, bx, curY);
  doc.text(`Bank Name : ${bank.bankName || ''}`, bx, curY + 3.8);
  doc.text(`A/c No. : ${bank.accountNo || ''}`, bx, curY + 7.6);
  doc.text(`Branch & IFS Code : ${bank.branchAndIfsc || ''}`, bx, curY + 11.4);

  // Signature Box
  const sigY = curY + 16;
  doc.rect(pageWidth - margin - 60, curY - 2, 60, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`for ${invoice.seller?.name || 'IJAZ TRADERS'}`, pageWidth - margin - 3, curY + 2, {
    align: 'right',
  });
  doc.setFont('helvetica', 'normal');
  doc.text('Authorised Signatory', pageWidth - margin - 3, curY + 15.5, { align: 'right' });

  doc.setFontSize(7);
  doc.text('This is a Computer Generated Invoice', pageWidth / 2, sigY + 8, { align: 'center' });

  const safeNum = String(invoice.invoiceNumber || 'invoice').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${invoice.documentType?.replace(/\s+/g, '_') || 'Invoice'}_${safeNum}.pdf`);
}

