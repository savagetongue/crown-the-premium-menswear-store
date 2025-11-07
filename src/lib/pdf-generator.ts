import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Invoice, StoreSettings } from '@shared/types';
import { format } from 'date-fns';
import { amountToWords } from './utils';
import QRCode from 'qrcode';
// Extend jsPDF with the autoTable plugin
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}
export async function generateInvoicePdf(invoice: Invoice, settings: StoreSettings) {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  let y = 20;
  // Store Info - Centered
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.name, pageWidth / 2, y, { align: 'center' });
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(settings.address, pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(`Phone: ${settings.phone || 'N/A'}`, pageWidth / 2, y, { align: 'center' });
  y += 12;
  // Invoice Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 15, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 15, y);
  doc.text(`Date: ${format(new Date(invoice.date), 'PPP')}`, 140, y);
  y += 6;
  // Customer Info
  doc.text(`Bill To: ${invoice.customer.name}`, 15, y);
  y += 10;
  // Items Table
  const tableData = invoice.items.map((item, index) => {
    let itemName = item.productName;
    let discountText = '-';
    if (item.originalPrice && item.originalPrice !== item.price) {
      itemName += `\n(Price modified from ₹${item.originalPrice.toFixed(2)})`;
      const fixedDiscount = item.originalPrice - item.price;
      const percentDiscount = (fixedDiscount / item.originalPrice) * 100;
      discountText = `-₹${fixedDiscount.toFixed(2)} (${percentDiscount.toFixed(2)}%)`;
    } else if (item.discount > 0) {
      discountText = item.discountType === 'fixed' ? `-₹${item.discount.toFixed(2)}` : `-${item.discount}%`;
    }
    return [
      index + 1,
      itemName,
      item.quantity,
      `₹${item.price.toFixed(2)}`,
      discountText,
      `₹${(item.price * item.quantity).toFixed(2)}`,
    ];
  });
  doc.autoTable({
    startY: y,
    head: [['#', 'Item', 'Qty', 'Price', 'Discount', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [23, 37, 84] }, // Deep Indigo
    styles: { fontSize: 9, cellPadding: 2 },
    didParseCell: function (data) {
        if (typeof data.cell.text === 'string' && data.cell.text.includes('\n')) {
            data.cell.styles.valign = 'middle';
        }
    }
  });
  y = (doc as any).autoTable.previous.finalY + 10;
  // Totals Section
  const totals = [
    ['Subtotal', `₹${invoice.subTotal.toFixed(2)}`],
    ['Discount', `-₹${invoice.totalDiscount.toFixed(2)}`],
    ['Tax (GST)', `₹${invoice.tax.toFixed(2)}`],
    ['Rounding', `₹${invoice.rounding.toFixed(2)}`],
  ];
  doc.autoTable({
    startY: y,
    body: totals,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1.5 },
    columnStyles: { 0: { halign: 'right' }, 1: { halign: 'right' } },
    tableWidth: 60,
    margin: { left: 135 },
  });
  y = (doc as any).autoTable.previous.finalY;
  doc.setLineWidth(0.5);
  doc.line(135, y + 2, 195, y + 2);
  y += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total', 135, y);
  doc.text(`₹${invoice.grandTotal.toFixed(2)}`, 195, y, { align: 'right' });
  y += 8;
  // Amount in words
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const amountInWordsText = `Amount in words: ${amountToWords(invoice.grandTotal)}`;
  const splitText = doc.splitTextToSize(amountInWordsText, 180);
  doc.text(splitText, 15, y);
  y += splitText.length * 4 + 5;
  // QR Code
  const invoiceUrl = `${window.location.origin}/invoice/${invoice.id}`;
  const qrCodeDataUrl = await QRCode.toDataURL(invoiceUrl, {
    errorCorrectionLevel: 'H',
    width: 40,
  });
  doc.addImage(qrCodeDataUrl, 'PNG', 15, y, 40, 40);
  // Footer
  const footerY = pageHeight - 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Thank you for shopping with ${settings.name}!`, doc.internal.pageSize.width / 2, footerY, { align: 'center' });
  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
}